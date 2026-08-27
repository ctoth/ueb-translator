import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import fc from "fast-check";

import {
  buildFuzzCase,
  divergenceFingerprint,
} from "./empirical.js";
import { buildFuzzArbitrary, parseFuzzRunConfiguration } from "./fuzz.js";
import {
  compareOracleTranslation,
  type ComparisonEvidence,
} from "./differential.js";
import type { DisagreementLedgerEntry } from "./ledger.js";
import {
  isCompactEmpiricalEntry,
  parseEmpiricalLedger,
} from "./empirical-ledger.js";
import { Grade2OracleSession } from "./oracle-session.js";
import { verifyOracleVersion } from "./runner.js";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  const outputPath = resolve(
    process.env["ORACLE_FUZZ_RESULT"] ?? ".oracle-artifacts/fuzz-result.json",
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  const ledgerPath = resolve(
    process.cwd(),
    "tools/liblouis-oracle/empirical-disagreements.json",
  );
  const parsedLedger = parseEmpiricalLedger(
    JSON.parse(readFileSync(ledgerPath, "utf8")),
  );
  if (!parsedLedger.ok) {
    throw new Error(`Invalid empirical disagreement ledger: ${parsedLedger.error}`);
  }
  const known = new Set(
    parsedLedger.ledger.disagreements
      .filter((entry): entry is DisagreementLedgerEntry =>
        !isCompactEmpiricalEntry(entry)
      )
      .map(divergenceFingerprint),
  );
  const configuration = parseFuzzRunConfiguration(process.env);
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  const session = new Grade2OracleSession(executable, version);
  let unexpected: ComparisonEvidence | undefined;
  try {
    const result = await fc.check(
      fc.asyncProperty(buildFuzzArbitrary(), async (input) => {
        const case_ = buildFuzzCase(input);
        const translation = await session.translate(case_.caseId, input);
        const comparison = compareOracleTranslation(case_, translation);
        if (comparison.ok || known.has(divergenceFingerprint(comparison.evidence))) {
          return true;
        }
        unexpected = comparison.evidence;
        return false;
      }),
      configuration,
    );
    if (result.failed) {
      if (unexpected === undefined) {
        throw new Error("fast-check failed without differential evidence");
      }
      writeFileSync(outputPath, `${JSON.stringify({
        counterexample: result.counterexample,
        counterexamplePath: result.counterexamplePath,
        evidence: unexpected,
        fingerprint: divergenceFingerprint(unexpected),
        numRuns: result.numRuns,
        numShrinks: result.numShrinks,
        ok: false,
        seed: result.seed,
      }, undefined, 2)}\n`);
      process.exitCode = 1;
      return;
    }
    writeFileSync(outputPath, `${JSON.stringify({
      numRuns: result.numRuns,
      numShrinks: result.numShrinks,
      ok: true,
      seed: result.seed,
    }, undefined, 2)}\n`);
  } finally {
    await session.close();
  }
}

void main().catch((error: unknown) => {
  const outputPath = resolve(
    process.env["ORACLE_FUZZ_RESULT"] ?? ".oracle-artifacts/fuzz-result.json",
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify({
    error: messageFrom(error),
    ok: false,
  }, undefined, 2)}\n`);
  process.exitCode = 1;
});
