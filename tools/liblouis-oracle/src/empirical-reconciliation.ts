import type {
  ComparisonEvidence,
  OracleComparison,
} from "./differential.js";
import {
  comparisonEvidenceDigest,
} from "./ledger.js";
import {
  isCompactEmpiricalEntry,
  type EmpiricalLedger,
  type EmpiricalLedgerEntry,
} from "./empirical-ledger.js";

export interface EmpiricalReconciliationResult {
  readonly ok: boolean;
  readonly stale: readonly EmpiricalLedgerEntry[];
  readonly untriaged: number;
}

export class EmpiricalReconciler {
  readonly #known: Map<string, EmpiricalLedgerEntry>;
  #untriaged = 0;
  readonly #writeUntriaged: (evidence: ComparisonEvidence) => void;

  constructor(
    ledger: EmpiricalLedger,
    caseIdPrefix: string,
    writeUntriaged: (evidence: ComparisonEvidence) => void,
  ) {
    this.#known = new Map(
      ledger.disagreements
        .filter((entry) => entry.caseId.startsWith(caseIdPrefix))
        .map((entry) => [
          isCompactEmpiricalEntry(entry)
            ? entry.evidenceDigest
            : comparisonEvidenceDigest(entry),
          entry,
        ]),
    );
    this.#writeUntriaged = writeUntriaged;
  }

  accept(comparison: OracleComparison): void {
    if (comparison.ok) {
      return;
    }
    const key = comparisonEvidenceDigest(comparison.evidence);
    if (this.#known.delete(key)) {
      return;
    }
    this.#untriaged += 1;
    this.#writeUntriaged(comparison.evidence);
  }

  finish(): EmpiricalReconciliationResult {
    const stale = [...this.#known.values()];
    return {
      ok: this.#untriaged === 0 && stale.length === 0,
      stale,
      untriaged: this.#untriaged,
    };
  }
}
