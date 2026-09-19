import { createHash } from "node:crypto";
import type { ComparisonEvidence } from "./differential.js";
import {
  comparisonEvidenceDigest, parseComparisonEvidence, parseVerdict,
  type DisagreementVerdict,
} from "./ledger.js";

export interface ReviewOccurrence {
  readonly evidenceDigest: string;
  readonly wordIndex?: number;
}
export interface ReviewGroup {
  readonly id: string;
  readonly alignment: "word" | "whole-input";
  readonly input: string;
  readonly local: string;
  readonly oracle: string;
  readonly occurrences: readonly ReviewOccurrence[];
}
export interface ReviewIndex {
  readonly evidence: readonly ComparisonEvidence[];
  readonly groups: readonly ReviewGroup[];
}
export interface ReviewDecision {
  readonly groupId: string;
  readonly evidenceDigests: readonly string[];
  readonly rule: string;
  readonly verdict: DisagreementVerdict;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function record(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) throw new Error("Expected an object");
  return value;
}

export function parseReviewRecord(value: unknown): ComparisonEvidence | undefined {
  const item = record(value);
  if (item["evidence"] === undefined) {
    if (["exploration-progress", "exploration-summary", "empirical-summary"]
      .some(kind => item["kind"] === kind)) return undefined;
    throw new Error("Expected differential evidence or a recognized progress/summary record");
  }
  const evidence = parseComparisonEvidence(item["evidence"]);
  if ("ok" in evidence) throw new Error(evidence.error);
  if (evidence.local.output === evidence.oracle.output) throw new Error("Review evidence contains no disagreement");
  if (item["evidenceDigest"] !== undefined && item["evidenceDigest"] !== comparisonEvidenceDigest(evidence)) {
    throw new Error("Evidence digest mismatch");
  }
  return evidence;
}

export function buildReview(records: readonly ComparisonEvidence[]): ReviewIndex {
  // Case IDs and semantic signatures cannot identify distinct source evidence.
  const evidence = [...new Map(records.map(e => [comparisonEvidenceDigest(e), e])).values()];
  const groups = new Map<string, ReviewGroup>();
  for (const entry of evidence) {
    const evidenceDigest = comparisonEvidenceDigest(entry);
    const words = entry.input.trim().split(/\s+/u);
    const local = entry.local.output.split(/[\s⠀]+/u);
    const oracle = entry.oracle.output.split(/[\s⠀]+/u);
    const separatorsMatch = JSON.stringify(entry.local.output.match(/[\s⠀]+/gu)) ===
      JSON.stringify(entry.oracle.output.match(/[\s⠀]+/gu));
    const aligned = words.length === local.length && local.length === oracle.length && separatorsMatch;
    const add = (input: string, left: string, right: string, wordIndex?: number): void => {
      if (left === right) return;
      const alignment = wordIndex === undefined ? "whole-input" : "word";
      const id = createHash("sha256").update(JSON.stringify({
        alignment, input, left, right, version: entry.oracle.version, tables: entry.oracle.tables,
      })).digest("hex");
      const occurrence = { evidenceDigest, ...(wordIndex === undefined ? {} : { wordIndex }) };
      const previous = groups.get(id);
      groups.set(id, { id, alignment, input, local: left, oracle: right,
        occurrences: [...(previous?.occurrences ?? []), occurrence] });
    };
    if (aligned) {
      for (const [index, word] of words.entries()) {
        const left = local[index], right = oracle[index];
        if (left === undefined || right === undefined) throw new Error("Missing aligned output");
        add(word, left, right, index);
      }
    } else add(entry.input, entry.local.output, entry.oracle.output);
  }
  return { evidence, groups: [...groups.values()].sort((a, b) =>
    b.occurrences.length - a.occurrences.length || a.id.localeCompare(b.id)) };
}

export function resolveGroup(index: ReviewIndex, prefix: string): ReviewGroup {
  const matches = index.groups.filter(g => g.id.startsWith(prefix));
  const group = matches[0];
  if (matches.length !== 1 || group === undefined) throw new Error(`Group prefix must match exactly one group: ${prefix}`);
  return group;
}

export function resolveDecision(index: ReviewIndex, value: unknown): ReviewDecision {
  const item = record(value);
  const id = item["groupId"], rule = item["rule"];
  if (typeof id !== "string" || id.length === 0 || typeof rule !== "string" || rule.trim().length === 0) {
    throw new Error("Decision needs groupId and an explicit normative rule locator");
  }
  const group = resolveGroup(index, id);
  const verdict = parseVerdict(item["verdict"]);
  if ("ok" in verdict) throw new Error(verdict.error);
  const available = new Set(group.occurrences.map(o => o.evidenceDigest));
  const scope = item["evidenceDigests"];
  const selected: string[] = [];
  if (scope === undefined) selected.push(...available);
  else {
    if (!Array.isArray(scope) || scope.length === 0) throw new Error("Decision scope must be non-empty");
    for (const digest of scope) {
      if (typeof digest !== "string" || !available.has(digest)) throw new Error("Decision selects evidence outside this group");
      selected.push(digest);
    }
  }
  return { groupId: group.id, evidenceDigests: [...new Set(selected)].sort(), rule, verdict };
}

export function currentDecisions(decisions: readonly ReviewDecision[]): ReadonlyMap<string, ReviewDecision> {
  const current = new Map<string, ReviewDecision>();
  for (const decision of decisions) {
    for (const digest of decision.evidenceDigests) current.set(`${decision.groupId}:${digest}`, decision);
  }
  return current;
}

export function resolveDecisions(index: ReviewIndex, value: unknown): readonly ReviewDecision[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Expected a non-empty decision array");
  return value.flatMap((entry: unknown) => {
    const item = record(entry), ids = item["groupIds"];
    if (ids === undefined) return [resolveDecision(index, entry)];
    if (item["groupId"] !== undefined || !Array.isArray(ids) || ids.length === 0) {
      throw new Error("Use either groupId or a non-empty groupIds array");
    }
    return ids.map((groupId: unknown) => resolveDecision(index, { ...item, groupId }));
  });
}

export function reviewSummary(index: ReviewIndex, decisions: readonly ReviewDecision[]): {
  readonly evidence: number;
  readonly groups: number;
  readonly reviewedOccurrences: number;
  readonly pendingOccurrences: number;
  readonly fullyReviewedEvidence: number;
  readonly verdicts: Readonly<Record<string, number>>;
} {
  const current = currentDecisions(decisions);
  const pending = new Set<string>();
  const verdicts: Record<string, number> = {};
  let reviewedOccurrences = 0, pendingOccurrences = 0;
  for (const group of index.groups) {
    for (const occurrence of group.occurrences) {
      const decision = current.get(`${group.id}:${occurrence.evidenceDigest}`);
      if (decision === undefined) {
        pending.add(occurrence.evidenceDigest);
        pendingOccurrences += 1;
      } else {
        reviewedOccurrences += 1;
        verdicts[decision.verdict.kind] = (verdicts[decision.verdict.kind] ?? 0) + 1;
      }
    }
  }
  return { evidence: index.evidence.length, groups: index.groups.length,
    reviewedOccurrences, pendingOccurrences, fullyReviewedEvidence: index.evidence.length - pending.size, verdicts };
}
