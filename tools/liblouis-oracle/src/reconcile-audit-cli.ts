import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEmpiricalCases } from "./empirical-inputs.js";
import { comparisonEvidenceDigest, parseComparisonEvidence } from "./ledger.js";
import { compareOracleTranslation, type DifferentialCase } from "./differential.js";
import { parseEmpiricalLedger, isCompactEmpiricalEntry } from "./empirical-ledger.js";
import { runOracleTranslations, verifyOracleVersion } from "./runner.js";

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected JSON object");
  return Object.fromEntries(Object.entries(value));
}

function isTranslator(value: unknown): value is (input: string) => unknown {
  return typeof value === "function";
}

async function main(): Promise<void> {
  const [ledgerPath, sweepPath, baselinePath, channel, ...paths] = process.argv.slice(2);
  if (!ledgerPath || !sweepPath || !baselinePath || !channel) {
    throw new Error("usage: reconcile-audit LEDGER SWEEP BASELINE_GRADE2_MODULE dictionary|corpus PATH...");
  }
  const ledger = parseEmpiricalLedger(JSON.parse(readFileSync(ledgerPath, "utf8")));
  if (!ledger.ok) throw new Error(ledger.error);
  const stale = new Map<string, string>();
  const untriaged = new Set<string>();
  let complete = false;
  for (const line of readFileSync(sweepPath, "utf8").trim().split(/\r?\n/u)) {
    const item = record(JSON.parse(line));
    if (item["kind"] === "empirical-summary") complete = true;
    if (item["kind"] === "stale-ledger-entry") {
      const entry = record(item["entry"]);
      const matches = ledger.ledger.disagreements.filter(e => e.caseId === entry["caseId"] &&
        JSON.stringify(e) === JSON.stringify(item["entry"]));
      const matched = matches[0];
      if (matches.length !== 1 || matched === undefined) throw new Error("Stale record does not match ledger");
      stale.set(isCompactEmpiricalEntry(matched) ? matched.evidenceDigest : comparisonEvidenceDigest(matched), matched.caseId);
    }
    if (item["kind"] === "untriaged-disagreement") {
      const evidence = parseComparisonEvidence(item["evidence"]);
      if ("ok" in evidence) throw new Error(evidence.error);
      untriaged.add(comparisonEvidenceDigest(evidence));
    }
  }
  if (!complete) throw new Error("Sweep is incomplete");
  const loaded: unknown = await import(pathToFileURL(resolve(baselinePath)).href);
  const translate = record(loaded)["translateGrade2"];
  if (!isTranslator(translate)) throw new Error("Baseline module must export translateGrade2");
  const selectedIds = new Set(stale.values());
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  let batch: DifferentialCase[] = [], resolved = 0, changed = 0;
  const seen = new Set<string>();
  const flush = async (): Promise<void> => {
    const results = await runOracleTranslations(executable, batch.map(c => ({
      direction: "forward", id: c.caseId, mode: c.mode, text: c.print,
    })), version);
    for (const [index, c] of batch.entries()) {
      const result = results[index];
      if (result === undefined) throw new Error("Missing oracle result");
      const after = compareOracleTranslation(c, result).evidence;
      const old = record(translate(c.print));
      const output = old["ok"] === true ? old["braille"] : `[[unsupported:${String(old["reason"])}:${String(old["character"])}:scalar-${String(old["scalarIndex"])}]]`;
      if (typeof output !== "string") throw new Error("Invalid baseline output");
      const before = { ...after, local: { ...after.local, output } };
      const digest = comparisonEvidenceDigest(before);
      if (!stale.has(digest)) continue; // A case ID can have multiple distinct source records.
      if (seen.has(digest)) throw new Error(`Duplicate source evidence ${digest}`);
      seen.add(digest);
      const agrees = after.local.output === after.oracle.output;
      if (agrees) resolved += 1;
      else {
        changed += 1;
        if (!untriaged.delete(comparisonEvidenceDigest(after))) throw new Error("Changed evidence missing from sweep");
      }
      console.log(JSON.stringify({ kind: "reconciliation-evidence", previousDigest: digest, before, evidence: after, agrees }));
    }
    batch = [];
  };
  for (const c of loadEmpiricalCases(channel, paths, selectedIds)) {
    if (!selectedIds.has(c.caseId)) continue;
    batch.push(c);
    if (batch.length === 500) await flush();
  }
  if (batch.length > 0) await flush();
  if (seen.size !== stale.size || untriaged.size !== 0) throw new Error(`Unreconciled evidence: ${String(stale.size - seen.size)} stale, ${String(untriaged.size)} new`);
  console.log(JSON.stringify({ kind: "reconciliation-summary", complete: true, resolved, changed, evidence: seen.size }));
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
