import type { ComparisonEvidence } from "./differential.js";
import { isCompactEmpiricalEntry, parseEmpiricalLedger } from "./empirical-ledger.js";
import { comparisonEvidenceDigest, type DisagreementVerdict } from "./ledger.js";

type RawRecord = Readonly<Record<string, unknown>>;

interface EditableLedger {
  readonly digests: readonly string[];
  readonly entries: readonly RawRecord[];
  readonly groups: readonly RawRecord[];
  readonly raw: RawRecord;
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate a raw empirical ledger and pair each raw entry with its evidence digest. */
function editable(value: unknown): EditableLedger {
  const parsed = parseEmpiricalLedger(value);
  if (!parsed.ok) throw new Error(parsed.error);
  if (!isRecord(value)) throw new Error("Ledger must be an object");
  const entries = value["disagreements"], groups = value["groups"];
  if (!Array.isArray(entries) || !Array.isArray(groups) ||
    !entries.every(isRecord) || !groups.every(isRecord)) {
    throw new Error("Ledger groups and disagreements must be object arrays");
  }
  const digests = parsed.ledger.disagreements.map((entry) =>
    isCompactEmpiricalEntry(entry) ? entry.evidenceDigest : comparisonEvidenceDigest(entry));
  return { digests, entries, groups, raw: value };
}

function checked(result: Record<string, unknown>): Record<string, unknown> {
  const parsed = parseEmpiricalLedger(result);
  if (!parsed.ok) throw new Error(parsed.error);
  return result;
}

/**
 * Record reviewed evidence under a verdict group. A new group requires its
 * reviewed verdict; an existing group keeps the verdict it already has.
 */
export function addLedgerEvidence(
  ledger: unknown,
  evidence: readonly ComparisonEvidence[],
  groupId: string,
  verdict?: DisagreementVerdict,
): Record<string, unknown> {
  if (evidence.length === 0) throw new Error("Add at least one evidence record");
  const { digests, entries, groups, raw } = editable(ledger);
  const groupExists = groups.some((group) => group["id"] === groupId);
  if (groupExists && verdict !== undefined) {
    throw new Error(`Group ${groupId} already exists; its verdict cannot be restated`);
  }
  if (!groupExists && verdict === undefined) {
    throw new Error(`New group ${groupId} needs a reviewed verdict`);
  }
  const present = new Set(digests);
  for (const record of evidence) {
    const digest = comparisonEvidenceDigest(record);
    if (present.has(digest)) throw new Error(`Evidence ${digest} is already in the ledger`);
    present.add(digest);
  }
  return checked({
    ...raw,
    disagreements: [...entries, ...evidence.map((record) => ({ ...record, groupId }))],
    groups: verdict === undefined ? groups : [...groups, { id: groupId, verdict }],
  });
}

/**
 * Replace audited evidence that still disagrees after a translator change.
 * Each transition comes from a reconciliation audit: its old evidence must be
 * in the ledger and its replayed evidence must still differ from the oracle.
 * The replacement joins the existing group whose verdict describes the
 * residual difference, keeping the old entry's position.
 */
export function supersedeLedgerEvidence(
  ledger: unknown,
  transitions: readonly { readonly after: ComparisonEvidence; readonly before: ComparisonEvidence }[],
  groupId: string,
): Record<string, unknown> {
  if (transitions.length === 0) throw new Error("Supersede at least one evidence record");
  const { digests, entries, groups, raw } = editable(ledger);
  if (!groups.some((group) => group["id"] === groupId)) throw new Error(`Unknown group ${groupId}`);
  const replacements = new Map<string, RawRecord>();
  const present = new Set(digests);
  for (const { after, before } of transitions) {
    if (after.local.output === after.oracle.output) {
      throw new Error(`Evidence for ${after.caseId} now agrees; remove it through reconciliation`);
    }
    const oldDigest = comparisonEvidenceDigest(before), newDigest = comparisonEvidenceDigest(after);
    if (!present.has(oldDigest)) throw new Error(`Evidence ${oldDigest} is not in the ledger`);
    if (present.has(newDigest)) throw new Error(`Evidence ${newDigest} is already in the ledger`);
    present.add(newDigest);
    replacements.set(oldDigest, { ...after, groupId });
  }
  const disagreements = entries.map((entry, index) => replacements.get(digests[index] ?? "") ?? entry);
  const used = new Set(disagreements.map((entry) => entry["groupId"]));
  return checked({
    ...raw,
    disagreements,
    groups: groups.filter((group) => used.has(group["id"])),
  });
}

/** Move evidence to the existing group whose verdict describes it, dropping emptied groups. */
export function regroupLedgerEvidence(
  ledger: unknown,
  selected: readonly string[],
  groupId: string,
): Record<string, unknown> {
  if (selected.length === 0) throw new Error("Regroup at least one evidence record");
  const { digests, entries, groups, raw } = editable(ledger);
  if (!groups.some((group) => group["id"] === groupId)) throw new Error(`Unknown group ${groupId}`);
  const moving = new Set(selected);
  for (const digest of moving) {
    if (!digests.includes(digest)) throw new Error(`Evidence ${digest} is not in the ledger`);
  }
  const disagreements = entries.map((entry, index) =>
    moving.has(digests[index] ?? "") ? { ...entry, groupId } : entry);
  const used = new Set(disagreements.map((entry) => entry["groupId"]));
  return checked({
    ...raw,
    disagreements,
    groups: groups.filter((group) => used.has(group["id"])),
  });
}
