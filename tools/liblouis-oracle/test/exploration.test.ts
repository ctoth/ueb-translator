import { describe, expect, it } from "vitest";

import { ExplorationTracker } from "../src/exploration.js";
import { comparisonEvidenceDigest } from "../src/ledger.js";
import { divergenceFingerprint } from "../src/empirical.js";
import type { ComparisonEvidence } from "../src/differential.js";

const evidence: ComparisonEvidence = {
  caseId: "corpus:same-content:0", input: "ab",
  local: { kind: "test", output: "local", testId: "document:one" },
  oracle: { engine: "liblouis", output: "oracle", status: "development oracle",
    tables: ["en-ueb-g2.ctb"], version: "3.38.0" },
};

describe("exploratory evidence collection", () => {
  it("preserves distinct source evidence sharing a case ID and a fingerprint", () => {
    const saved: ComparisonEvidence[] = [];
    const tracker = new ExplorationTracker(new Set(), comparisonEvidenceDigest,
      (entry) => saved.push(entry));
    const second = { ...evidence, local: { ...evidence.local, testId: "document:two" } };
    tracker.accept(evidence);
    tracker.accept(second);
    tracker.accept(evidence);
    expect(saved).toEqual([evidence, second]);
    expect(tracker.summary()).toMatchObject({
      cases: 3, disagreements: 3, untriaged: 3, uniqueEvidence: 2,
      uniqueFingerprints: 1, ok: false,
    });
  });

  it("does not consume known evidence when the same case occurs twice", () => {
    const tracker = new ExplorationTracker(new Set([comparisonEvidenceDigest(evidence)]),
      comparisonEvidenceDigest, () => { throw new Error("Known evidence emitted"); });
    tracker.accept(evidence);
    tracker.accept(evidence);
    tracker.accept();
    expect(tracker.summary()).toMatchObject({cases: 3, disagreements: 2,
      known: 2, untriaged: 0, ok: true});
  });

  it("can recognize fuzz signatures without conflating exact evidence identities", () => {
    const tracker = new ExplorationTracker(new Set([divergenceFingerprint(evidence)]),
      divergenceFingerprint, () => { throw new Error("Known signature emitted"); });
    tracker.accept({ ...evidence, caseId: "another" });
    expect(tracker.summary()).toMatchObject({ known: 1, uniqueEvidence: 0 });
  });
});
