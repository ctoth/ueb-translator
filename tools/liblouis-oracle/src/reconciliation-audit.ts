import { createHash } from "node:crypto";
import { comparisonEvidenceDigest } from "./ledger.js";
import type { ComparisonEvidence } from "./differential.js";

export interface EvidenceRepair {
  readonly input: string;
  readonly before: string;
  readonly after: string;
  readonly oracle: string;
}

/** Only identical source identities and unchanged oracle outputs can be reconciled. */
export function evidenceRepairs(before: ComparisonEvidence, after: ComparisonEvidence): readonly EvidenceRepair[] {
  if (comparisonEvidenceDigest({ ...before, local: { ...before.local, output: after.local.output } }) !== comparisonEvidenceDigest(after)) {
    throw new Error("Reconciliation changed source identity or oracle output");
  }
  const inputs = before.input.trim().split(/\s+/u);
  const previous = before.local.output.split(/[\s⠀]+/u);
  const current = after.local.output.split(/[\s⠀]+/u);
  const oracle = after.oracle.output.split(/[\s⠀]+/u);
  const separators = (value: string): string => JSON.stringify(value.match(/[\s⠀]+/gu));
  if ([previous, current, oracle].some(parts => parts.length !== inputs.length) ||
      separators(before.local.output) !== separators(after.local.output) ||
      separators(after.local.output) !== separators(after.oracle.output)) {
    return [{ input: before.input, before: before.local.output, after: after.local.output, oracle: after.oracle.output }];
  }
  return inputs.flatMap((input, index) => {
    const left = previous[index], right = current[index], expected = oracle[index];
    if (left === undefined || right === undefined || expected === undefined) throw new Error("Missing aligned token");
    return left === right ? [] : [{ input, before: left, after: right, oracle: expected }];
  });
}

export function repairDigest(repair: EvidenceRepair): string {
  return createHash("sha256").update(JSON.stringify([repair.input, repair.before, repair.after, repair.oracle])).digest("hex");
}

/** A repaired prefix may leave a byte-identical, previously adjudicated suffix. */
export function repairAgrees(repair: EvidenceRepair): boolean {
  if (repair.after === repair.oracle) return true;
  let suffix = 0;
  while (suffix < repair.before.length && suffix < repair.after.length &&
      repair.before.at(-suffix - 1) === repair.after.at(-suffix - 1)) suffix += 1;
  const correctedPrefix = repair.after.slice(0, repair.after.length - suffix);
  return suffix > 0 && correctedPrefix.length > 0 &&
    repair.oracle.startsWith(repair.after.slice(0, correctedPrefix.length + 1));
}

export function assertReviewedRepairs(before: ComparisonEvidence, after: ComparisonEvidence, approved: ReadonlySet<string>): void {
  const repairs = evidenceRepairs(before, after);
  if (repairs.length === 0) throw new Error("No evidence change to reconcile");
  for (const repair of repairs) {
    if (!repairAgrees(repair)) throw new Error("Changed token still disagrees; requires a new adjudication");
    if (!approved.has(repairDigest(repair))) throw new Error(`Unreviewed repair: ${repair.input}`);
  }
}
