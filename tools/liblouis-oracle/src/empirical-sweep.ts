import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseManifest } from "../../corpus-benchmark/src/manifest.js";
import { verifyDocumentRecord } from "../../corpus-benchmark/src/corpus.js";
import {
  buildCorpusCases,
  buildDictionaryCase,
  parseScowlWordList,
} from "./empirical.js";
import { EmpiricalReconciler } from "./empirical-reconciliation.js";
import {
  compareOracleTranslation,
  type DifferentialCase,
} from "./differential.js";
import { parseEmpiricalLedger } from "./empirical-ledger.js";
import { runOracleTranslations, verifyOracleVersion } from "./runner.js";

const BATCH_SIZE = 2_000;

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function* loadCorpusCases(root: string): Generator<DifferentialCase> {
  const corpusRoot = resolve(root);
  const manifest = parseManifest(
    readFileSync(resolve(corpusRoot, "manifest.json"), "utf8"),
  );
  for (const document of manifest.documents) {
    const text = readFileSync(resolve(corpusRoot, document.relativePath), "utf8");
    if (!verifyDocumentRecord(document, text)) {
      throw new Error(`Corpus document digest mismatch: ${document.id}`);
    }
    yield* buildCorpusCases({
      documentId: document.id,
      documentSha256: document.sha256,
      text,
    });
  }
}

async function sweep(
  cases: Iterable<DifferentialCase>,
  caseIdPrefix: string,
  ledgerName: string,
): Promise<void> {
  const ledgerPath = resolve(
    process.cwd(),
    `tools/liblouis-oracle/${ledgerName}`,
  );
  const parsedLedger = parseEmpiricalLedger(
    JSON.parse(readFileSync(ledgerPath, "utf8")),
  );
  if (!parsedLedger.ok) {
    throw new Error(`Invalid empirical disagreement ledger: ${parsedLedger.error}`);
  }
  const reconciler = new EmpiricalReconciler(
    parsedLedger.ledger,
    caseIdPrefix,
    (evidence) => {
      writeJson({ evidence, kind: "untriaged-disagreement", ok: false });
    },
  );
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  let caseCount = 0;
  let disagreements = 0;
  let batch: DifferentialCase[] = [];
  const runBatch = async (): Promise<void> => {
    const translations = await runOracleTranslations(
      executable,
      batch.map((case_) => ({
        direction: "forward",
        id: case_.caseId,
        mode: case_.mode,
        text: case_.print,
      })),
      version,
    );
    for (const [index, case_] of batch.entries()) {
      const translation = translations[index];
      if (translation === undefined) {
        throw new Error(`Missing batched oracle response for ${case_.caseId}`);
      }
      const comparison = compareOracleTranslation(case_, translation);
      if (!comparison.ok) {
        disagreements += 1;
      }
      reconciler.accept(comparison);
    }
    caseCount += batch.length;
  };
  for (const case_ of cases) {
    batch.push(case_);
    if (batch.length === BATCH_SIZE) {
      await runBatch();
      batch = [];
    }
  }
  if (batch.length > 0) {
    await runBatch();
  }
  const result = reconciler.finish();
  for (const entry of result.stale) {
    writeJson({ entry, kind: "stale-ledger-entry", ok: false });
  }
  writeJson({
    cases: caseCount,
    disagreements,
    kind: "empirical-summary",
    ok: result.ok,
    stale: result.stale.length,
    untriaged: result.untriaged,
  });
  if (!result.ok) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const [channel, ...paths] = process.argv.slice(2);
  if (channel === "dictionary" && paths.length === 1) {
    const words = parseScowlWordList(readFileSync(resolve(paths[0] ?? ""), "utf8"));
    await sweep(words.map(buildDictionaryCase), "scowl:", "empirical-disagreements.json");
    return;
  }
  if (channel === "corpus" && paths.length > 0) {
    function* allCorpusCases(): Generator<DifferentialCase> {
      for (const path of paths) {
        yield* loadCorpusCases(path);
      }
    }
    await sweep(allCorpusCases(), "corpus:", "empirical-corpus-disagreements.json");
    return;
  }
  throw new Error(
    "usage: empirical-sweep dictionary WORDLIST | empirical-sweep corpus CORPUS...",
  );
}

void main().catch((error: unknown) => {
  writeJson({
    error: { code: "empirical-failure", message: messageFrom(error) },
    kind: "empirical-error",
    ok: false,
  });
  process.exitCode = 1;
});
