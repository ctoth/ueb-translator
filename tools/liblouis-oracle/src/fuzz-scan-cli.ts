import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { divergenceFingerprint } from "./empirical.js";
import { isCompactEmpiricalEntry, parseEmpiricalLedger } from "./empirical-ledger.js";
import { ExplorationTracker } from "./exploration.js";
import { parseFuzzRunConfiguration } from "./fuzz.js";
import { scanFuzzCases } from "./fuzz-scan.js";
import { comparisonEvidenceDigest } from "./ledger.js";
import { Grade2OracleSession } from "./oracle-session.js";
import { verifyOracleVersion } from "./runner.js";

const output = resolve(process.env["ORACLE_SCAN_DIRECTORY"] ?? ".oracle-artifacts/fuzz-scan");

async function main(): Promise<void> {
  // Exclusive creation prevents an accidental replay from destroying old evidence.
  mkdirSync(dirname(output), { recursive: true });
  mkdirSync(output);
  const configuration = parseFuzzRunConfiguration(process.env);
  writeFileSync(resolve(output, "configuration.json"), `${JSON.stringify(configuration)}\n`, { flag: "wx" });
  const ledger = parseEmpiricalLedger(JSON.parse(readFileSync("tools/liblouis-oracle/empirical-disagreements.json", "utf8")));
  if (!ledger.ok) throw new Error(ledger.error);
  const known = new Set(ledger.ledger.disagreements.flatMap((entry) =>
    isCompactEmpiricalEntry(entry) ? [] : [divergenceFingerprint(entry)]));
  const tracker = new ExplorationTracker(known, divergenceFingerprint, (evidence) => {
    appendFileSync(resolve(output, "evidence.jsonl"), `${JSON.stringify({
      evidence, evidenceDigest: comparisonEvidenceDigest(evidence),
      fingerprint: divergenceFingerprint(evidence),
    })}\n`);
  });
  const report = (complete: boolean): void => {
    const summary = { ...configuration, ...tracker.summary(), complete };
    writeFileSync(resolve(output, "summary.json"), `${JSON.stringify(summary)}\n`);
    console.log(JSON.stringify(summary));
  };
  report(false);
  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const session = new Grade2OracleSession(executable, await verifyOracleVersion(executable));
  try {
    await scanFuzzCases(configuration, tracker,
      (id, input) => session.translate(id, input), () => { report(false); });
  } finally {
    await session.close();
  }
  report(true);
  if (!tracker.summary().ok) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
