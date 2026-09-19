import { describe, expect, it } from "vitest";
import { assertReviewedRepairs, evidenceRepairs, repairDigest, repairAgrees } from "../src/reconciliation-audit.js";
import type { ComparisonEvidence } from "../src/differential.js";

const source: ComparisonEvidence = {
  caseId: "shared", input: "word other", local: { kind: "test", testId: "source-a", output: "a b" },
  oracle: { engine: "liblouis", version: "3.38.0", tables: ["en-ueb-g2.ctb"], status: "test", output: "c d" },
};
const corrected: ComparisonEvidence = { ...source, local: { ...source.local, output: "c b" } };
describe("evidence repair review", () => {
  it("proves a corrected prefix while retaining the exact residual suffix", () => {
    expect(repairAgrees({ input: "been—the", before: "⠆⠢⠐⠠⠤⠮", after: "⠃⠑⠢⠐⠠⠤⠮", oracle: "⠃⠑⠢⠠⠤⠮" })).toBe(true);
    expect(repairAgrees({ input: "x", before: "abc", after: "ac", oracle: "ab" })).toBe(false);
  });
  it("proves the exact repaired token while preserving an unchanged residual disagreement", () => {
    const repairs = evidenceRepairs(source, corrected);
    expect(repairs).toEqual([{ input: "word", before: "a", after: "c", oracle: "c" }]);
    expect(() => { assertReviewedRepairs(source, corrected, new Set(repairs.map(repairDigest))); }).not.toThrow();
  });
  it("requires an explicit reviewed transition and agreement of each changed token", () => {
    expect(() => { assertReviewedRepairs(source, corrected, new Set()); }).toThrow("Unreviewed");
    expect(() => { assertReviewedRepairs(source, { ...source, local: { ...source.local, output: "e b" } }, new Set()); }).toThrow("still disagrees");
    expect(() => { assertReviewedRepairs(source, source, new Set()); }).toThrow("No evidence change");
  });
  it("rejects source identity collapse even when the case ID is identical", () => {
    expect(() => evidenceRepairs(source, { ...corrected, local: { kind: "test", testId: "source-b", output: "c b" } })).toThrow("source identity");
    expect(() => evidenceRepairs(source, { ...corrected, oracle: { ...source.oracle, version: "other" } })).toThrow("oracle output");
  });
  it("keeps separator changes as whole-input evidence", () => {
    expect(evidenceRepairs(source, { ...corrected, local: { ...source.local, output: "c  d" } })).toEqual([
      { input: "word other", before: "a b", after: "c  d", oracle: "c d" },
    ]);
  });
});
