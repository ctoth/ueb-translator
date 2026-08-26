import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  compareOracleTranslation,
  type OracleComparison,
} from "./differential.js";
import { buildOracleInventory } from "./inventory.js";
import {
  parseDisagreementLedger,
  reconcileDisagreements,
} from "./ledger.js";
import { runOracleTranslation, verifyOracleVersion } from "./runner.js";

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  const ledgerPath = resolve(
    process.cwd(),
    "tools/liblouis-oracle/disagreements.json",
  );
  const parsedLedger = parseDisagreementLedger(
    JSON.parse(readFileSync(ledgerPath, "utf8")),
  );
  if (!parsedLedger.ok) {
    throw new Error(`Invalid disagreement ledger: ${parsedLedger.error}`);
  }

  const executable = process.env["LIBLOUIS_ORACLE_BIN"] ?? "lou_translate";
  const version = await verifyOracleVersion(executable);
  const inventory = buildOracleInventory();
  const comparisons: OracleComparison[] = [];
  for (const case_ of inventory) {
    const translation = await runOracleTranslation(
      executable,
      {
        direction: "forward",
        id: case_.caseId,
        mode: case_.mode,
        text: case_.print,
      },
      version,
    );
    comparisons.push(compareOracleTranslation(case_, translation));
  }

  const reconciliation = reconcileDisagreements(
    comparisons,
    parsedLedger.ledger,
  );
  for (const evidence of reconciliation.untriaged) {
    writeJson({ evidence, kind: "untriaged-disagreement", ok: false });
  }
  for (const entry of reconciliation.stale) {
    writeJson({ entry, kind: "stale-ledger-entry", ok: false });
  }
  const disagreementCount = comparisons.filter(
    (comparison) => !comparison.ok,
  ).length;
  writeJson({
    cases: inventory.length,
    disagreements: disagreementCount,
    kind: "inventory-summary",
    ok: reconciliation.ok,
    stale: reconciliation.stale.length,
    untriaged: reconciliation.untriaged.length,
  });
  if (!reconciliation.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  writeJson({
    error: { code: "inventory-failure", message: messageFrom(error) },
    kind: "inventory-error",
    ok: false,
  });
  process.exitCode = 1;
});
