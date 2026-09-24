import type { ComparisonEvidence } from "./differential.js";
import { divergenceFingerprint } from "./empirical.js";
import { comparisonEvidenceDigest } from "./ledger.js";

/** Collect findings without consuming or modifying the adjudicated baseline. */
export class ExplorationTracker {
  readonly #isKnown: (evidence: ComparisonEvidence) => boolean;
  readonly #write: (evidence: ComparisonEvidence) => void;
  readonly #digests = new Set<string>();
  readonly #fingerprints = new Set<string>();
  #cases = 0;
  #disagreements = 0;
  #knownCount = 0;

  constructor(
    isKnown: (evidence: ComparisonEvidence) => boolean,
    write: (evidence: ComparisonEvidence) => void,
  ) {
    this.#isKnown = isKnown;
    this.#write = write;
  }

  accept(evidence?: ComparisonEvidence): void {
    this.#cases += 1;
    if (evidence === undefined) return;
    this.#disagreements += 1;
    if (this.#isKnown(evidence)) {
      this.#knownCount += 1;
      return;
    }
    const digest = comparisonEvidenceDigest(evidence);
    if (!this.#digests.has(digest)) {
      this.#write(evidence);
      this.#digests.add(digest);
    }
    this.#fingerprints.add(divergenceFingerprint(evidence));
  }

  summary(): {
    readonly cases: number;
    readonly disagreements: number;
    readonly known: number;
    readonly ok: boolean;
    readonly uniqueEvidence: number;
    readonly uniqueFingerprints: number;
    readonly untriaged: number;
  } {
    return {
      cases: this.#cases,
      disagreements: this.#disagreements,
      known: this.#knownCount,
      ok: this.#disagreements === this.#knownCount,
      uniqueEvidence: this.#digests.size,
      uniqueFingerprints: this.#fingerprints.size,
      untriaged: this.#disagreements - this.#knownCount,
    };
  }
}
