import {
  parseDisagreementLedger,
  type DisagreementLedgerEntry,
  type DisagreementVerdict,
} from "./ledger.js";

export interface CompactEmpiricalRepro {
  readonly input: string;
  readonly localChanged: string;
  readonly oracleChanged: string;
}

export interface CompactEmpiricalLedgerEntry {
  readonly caseId: string;
  readonly evidenceDigest: string;
  readonly groupId: string;
  readonly repro: CompactEmpiricalRepro;
  readonly verdict: DisagreementVerdict;
}

export type EmpiricalLedgerEntry =
  | CompactEmpiricalLedgerEntry
  | DisagreementLedgerEntry;

export interface EmpiricalLedger {
  readonly disagreements: readonly EmpiricalLedgerEntry[];
  readonly version: 2;
}

export interface InvalidEmpiricalLedger {
  readonly error: string;
  readonly ok: false;
}

export interface ValidEmpiricalLedger {
  readonly ledger: EmpiricalLedger;
  readonly ok: true;
}

export type EmpiricalLedgerParseResult =
  | InvalidEmpiricalLedger
  | ValidEmpiricalLedger;

const compactFields = new Set([
  "caseId", "evidenceDigest", "groupId", "repro",
]);
const reproFields = new Set(["input", "localChanged", "oracleChanged"]);

function invalid(error: string): InvalidEmpiricalLedger {
  return { error, ok: false };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownField(
  value: Readonly<Record<string, unknown>>,
  fields: ReadonlySet<string>,
): string | undefined {
  return Object.keys(value).find((field) => !fields.has(field));
}

function parseGroupVerdict(value: unknown): DisagreementVerdict | InvalidEmpiricalLedger {
  const parsed = parseDisagreementLedger({
    disagreements: [{
      caseId: "group-verdict-validation",
      input: "",
      local: { kind: "test", output: "", testId: "validation" },
      oracle: {
        engine: "liblouis",
        output: "",
        status: "validation",
        tables: ["en-ueb-g2.ctb"],
        version: "3.38.0",
      },
      verdict: value,
    }],
    version: 1,
  });
  return parsed.ok ? parsed.ledger.disagreements[0]?.verdict ?? invalid("missing verdict") : invalid(parsed.error);
}

function parseCompact(
  value: Readonly<Record<string, unknown>>,
  verdict: DisagreementVerdict,
): CompactEmpiricalLedgerEntry | InvalidEmpiricalLedger {
  const extra = unknownField(value, compactFields);
  if (extra !== undefined) {
    return invalid(`unknown compact empirical field: ${extra}`);
  }
  const caseId = value["caseId"];
  const evidenceDigest = value["evidenceDigest"];
  const groupId = value["groupId"];
  const repro = value["repro"];
  if (
    typeof caseId !== "string" || caseId.length === 0 ||
    typeof groupId !== "string" || groupId.length === 0 ||
    typeof evidenceDigest !== "string" || !/^[\da-f]{64}$/u.test(evidenceDigest) ||
    !isRecord(repro)
  ) {
    return invalid("compact empirical evidence identity is invalid");
  }
  const reproExtra = unknownField(repro, reproFields);
  const input = repro["input"];
  const localChanged = repro["localChanged"];
  const oracleChanged = repro["oracleChanged"];
  if (
    reproExtra !== undefined || typeof input !== "string" || input.length > 72 ||
    typeof localChanged !== "string" || localChanged.length > 24 ||
    typeof oracleChanged !== "string" || oracleChanged.length > 24
  ) {
    return invalid("compact empirical repro is invalid");
  }
  return { caseId, evidenceDigest, groupId, repro: { input, localChanged, oracleChanged }, verdict };
}

export function isCompactEmpiricalEntry(
  entry: EmpiricalLedgerEntry,
): entry is CompactEmpiricalLedgerEntry {
  return "evidenceDigest" in entry;
}

export function parseEmpiricalLedger(value: unknown): EmpiricalLedgerParseResult {
  if (!isRecord(value) || value["version"] !== 2) {
    return invalid("empirical ledger must be a version-2 object");
  }
  const groupValues = value["groups"];
  const disagreementValues = value["disagreements"];
  if (!Array.isArray(groupValues) || !Array.isArray(disagreementValues)) {
    return invalid("empirical ledger groups and disagreements must be arrays");
  }
  const groups = new Map<string, DisagreementVerdict>();
  for (const group of groupValues) {
    if (!isRecord(group) || typeof group["id"] !== "string" || group["id"].length === 0) {
      return invalid("empirical verdict group must have a non-empty id");
    }
    if (groups.has(group["id"])) {
      return invalid(`duplicate empirical verdict group: ${group["id"]}`);
    }
    const verdict = parseGroupVerdict(group["verdict"]);
    if ("ok" in verdict) {
      return verdict;
    }
    groups.set(group["id"], verdict);
  }
  const usedGroups = new Set<string>();
  const disagreements: EmpiricalLedgerEntry[] = [];
  for (const disagreement of disagreementValues) {
    if (!isRecord(disagreement) || typeof disagreement["groupId"] !== "string") {
      return invalid("empirical disagreement must reference a verdict group");
    }
    const groupId = disagreement["groupId"];
    const verdict = groups.get(groupId);
    if (verdict === undefined) {
      return invalid(`unknown empirical verdict group: ${groupId}`);
    }
    usedGroups.add(groupId);
    if ("evidenceDigest" in disagreement) {
      const compact = parseCompact(disagreement, verdict);
      if ("ok" in compact) {
        return compact;
      }
      disagreements.push(compact);
      continue;
    }
    const evidence = { ...disagreement };
    delete evidence["groupId"];
    const parsed = parseDisagreementLedger({
      disagreements: [{ ...evidence, verdict }],
      version: 1,
    });
    if (!parsed.ok) {
      return invalid(parsed.error);
    }
    const entry = parsed.ledger.disagreements[0];
    if (entry === undefined) {
      return invalid("missing expanded empirical disagreement");
    }
    disagreements.push(entry);
  }
  const unused = [...groups.keys()].find((groupId) => !usedGroups.has(groupId));
  if (unused !== undefined) {
    return invalid(`unused empirical verdict group: ${unused}`);
  }
  return { ledger: { disagreements, version: 2 }, ok: true };
}
