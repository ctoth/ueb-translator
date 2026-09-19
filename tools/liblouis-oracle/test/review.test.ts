import { describe, expect, it } from "vitest";
import type { ComparisonEvidence } from "../src/differential.js";
import { comparisonEvidenceDigest } from "../src/ledger.js";
import { buildReview, parseReviewRecord, reviewSummary, resolveDecision, resolveDecisions } from "../src/review.js";

const evidence: ComparisonEvidence = {
  caseId: "content:one", input: "alpha beta",
  local: { kind: "test", output: "A⠀B", testId: "source:one" },
  oracle: { engine: "liblouis", status: "test", version: "3.38.0", tables: ["en-ueb-g2.ctb"], output: "a⠀b" },
};
const verdict = { kind: "our-bug", rationale: "The cited rule prohibits this contraction.",
  sources: ["https://iceb.org/publications/ueb/"] };

describe("evidence review", () => {
  it("preserves source digests sharing case IDs, while deduplicating exact evidence", () => {
    const other = { ...evidence, local: { ...evidence.local, testId: "source:two" } };
    const index = buildReview([evidence, other, evidence]);
    expect(index.evidence).toHaveLength(2);
    expect(index.groups).toHaveLength(2);
    expect(index.groups[0]?.occurrences).toHaveLength(2);
  });
  it("never aligns words when braille token counts differ", () => {
    const index = buildReview([{ ...evidence, oracle: { ...evidence.oracle, output: "ab" } }]);
    expect(index.groups).toHaveLength(1);
    expect(index.groups[0]).toMatchObject({ alignment: "whole-input", input: "alpha beta" });
  });
  it("retains separator-only differences instead of reporting them already reviewed", () => {
    const index = buildReview([{ ...evidence, local: { ...evidence.local, output: "a b" },
      oracle: { ...evidence.oracle, output: "a⠀b" } }]);
    expect(index.groups).toHaveLength(1);
    expect(index.groups[0]?.alignment).toBe("whole-input");
    expect(reviewSummary(index, []).fullyReviewedEvidence).toBe(0);
  });
  it("keeps local context and distinguishes oracle versions when grouping", () => {
    const index = buildReview([evidence, { ...evidence, oracle: { ...evidence.oracle, version: "other" } }]);
    expect(index.groups).toHaveLength(4);
    expect(index.groups.every(g => g.occurrences.every(o => o.wordIndex !== undefined))).toBe(true);
  });
  it("rejects mismatched digests and malformed records instead of silently dropping them", () => {
    expect(() => parseReviewRecord({ evidence, evidenceDigest: "wrong" })).toThrow("digest mismatch");
    expect(() => parseReviewRecord({ evidence: { input: "broken" } })).toThrow();
    expect(() => parseReviewRecord({ kind: "empirical-error" })).toThrow();
    expect(parseReviewRecord({ kind: "exploration-progress", cases: 2 })).toBeUndefined();
    expect(parseReviewRecord({ evidence, evidenceDigest: comparisonEvidenceDigest(evidence) })).toEqual(evidence);
  });
  it("does not mark a multi-difference sentence reviewed after just one decision", () => {
    const index = buildReview([evidence]);
    const group = index.groups[0];
    if (group === undefined) throw new Error("Missing fixture group");
    const decision = resolveDecision(index, { groupId: group.id, rule: "10.6.1", verdict });
    expect(reviewSummary(index, [decision])).toMatchObject({ reviewedOccurrences: 1, fullyReviewedEvidence: 0 });
    const decisions = index.groups.map(g => resolveDecision(index, { groupId: g.id, rule: "10.6.1", verdict }));
    expect(reviewSummary(index, decisions)).toMatchObject({ fullyReviewedEvidence: 1, pendingOccurrences: 0 });
  });
  it("can limit a decision to an exact source and retains later revisions", () => {
    const other = { ...evidence, local: { ...evidence.local, testId: "source:two" } };
    const index = buildReview([evidence, other]);
    const group = index.groups[0];
    if (group === undefined) throw new Error("Missing fixture group");
    const decision = resolveDecision(index, { groupId: group.id, rule: "10.6.1", verdict,
      evidenceDigests: [comparisonEvidenceDigest(evidence)] });
    expect(decision.evidenceDigests).toHaveLength(1);
    const revision = resolveDecision(index, { ...decision,
      verdict: { ...verdict, kind: "liblouis-bug", rationale: "Corrected after checking the source." } });
    expect(reviewSummary(index, [decision, revision]).verdicts).toEqual({ "liblouis-bug": 1 });
  });
  it("rejects unknown groups, empty scopes, unlisted sources and absent normative citations", () => {
    const index = buildReview([evidence]);
    const group = index.groups[0];
    if (group === undefined) throw new Error("Missing fixture group");
    expect(() => resolveDecision(index, { groupId: "unknown", rule: "10", verdict })).toThrow();
    expect(() => resolveDecision(index, { groupId: group.id, rule: "10", verdict, evidenceDigests: [] })).toThrow();
    expect(() => resolveDecision(index, { groupId: group.id, rule: "10", verdict, evidenceDigests: ["unknown"] })).toThrow();
    expect(() => resolveDecision(index, { groupId: group.id, rule: "10", verdict: { ...verdict, sources: [] } })).toThrow();
  });
  it("resolves explicit batch groups and rejects a bad batch before any decisions are returned", () => {
    const index = buildReview([evidence]);
    const batch = { groupIds: index.groups.map(g => g.id), rule: "10.6.1", verdict };
    expect(resolveDecisions(index, [batch])).toHaveLength(2);
    expect(() => resolveDecisions(index, [{ ...batch, groupIds: [...batch.groupIds, "unknown"] }])).toThrow();
  });
});
