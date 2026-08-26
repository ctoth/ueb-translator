import type {
  ComparisonEvidence,
  OracleComparison,
} from "./differential.js";

export type DisagreementVerdictKind =
  | "liblouis-bug"
  | "our-bug"
  | "permitted-alternative";

export interface DisagreementVerdict {
  readonly kind: DisagreementVerdictKind;
  readonly rationale: string;
  readonly sources: readonly string[];
}

export interface DisagreementLedgerEntry extends ComparisonEvidence {
  readonly verdict: DisagreementVerdict;
}

export interface DisagreementLedger {
  readonly disagreements: readonly DisagreementLedgerEntry[];
  readonly version: 1;
}

export interface InvalidDisagreementLedger {
  readonly error: string;
  readonly ok: false;
}

export interface ValidDisagreementLedger {
  readonly ledger: DisagreementLedger;
  readonly ok: true;
}

export type DisagreementLedgerParseResult =
  | InvalidDisagreementLedger
  | ValidDisagreementLedger;

export interface DisagreementReconciliation {
  readonly ok: boolean;
  readonly stale: readonly DisagreementLedgerEntry[];
  readonly untriaged: readonly ComparisonEvidence[];
}

const ledgerFields = new Set(["disagreements", "version"]);
const entryFields = new Set(["caseId", "input", "local", "oracle", "verdict"]);
const localRuleFields = new Set(["kind", "output", "ruleId"]);
const localTestFields = new Set(["kind", "output", "testId"]);
const oracleFields = new Set([
  "engine",
  "output",
  "status",
  "tables",
  "version",
]);
const verdictFields = new Set(["kind", "rationale", "sources"]);

function invalid(error: string): InvalidDisagreementLedger {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOfficialSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "iceb.org" ||
      url.hostname.endsWith(".iceb.org") ||
      url.hostname === "brailleauthority.org" ||
      url.hostname.endsWith(".brailleauthority.org")
    );
  } catch {
    return false;
  }
}

function parseLocal(
  value: unknown,
): InvalidDisagreementLedger | ComparisonEvidence["local"] {
  if (!isRecord(value)) {
    return invalid("local must be an object");
  }
  const kind = value["kind"];
  const fields = kind === "rule" ? localRuleFields : localTestFields;
  const extra = unknownField(value, fields);
  if (extra !== undefined) {
    return invalid(`unknown local field: ${extra}`);
  }
  const output = value["output"];
  if (typeof output !== "string") {
    return invalid("local.output must be a string");
  }
  if (kind === "rule") {
    const ruleId = value["ruleId"];
    return isNonEmptyString(ruleId)
      ? { kind, output, ruleId }
      : invalid("local.ruleId must be a non-empty string");
  }
  if (kind === "test") {
    const testId = value["testId"];
    return isNonEmptyString(testId)
      ? { kind, output, testId }
      : invalid("local.testId must be a non-empty string");
  }
  return invalid("local.kind must be rule or test");
}

function parseOracle(
  value: unknown,
): InvalidDisagreementLedger | ComparisonEvidence["oracle"] {
  if (!isRecord(value)) {
    return invalid("oracle must be an object");
  }
  const extra = unknownField(value, oracleFields);
  if (extra !== undefined) {
    return invalid(`unknown oracle field: ${extra}`);
  }
  const tables = value["tables"];
  if (
    value["engine"] !== "liblouis" ||
    typeof value["output"] !== "string" ||
    !isNonEmptyString(value["status"]) ||
    !Array.isArray(tables) ||
    tables.length === 0 ||
    !tables.every(isNonEmptyString) ||
    !isNonEmptyString(value["version"])
  ) {
    return invalid("oracle evidence is incomplete");
  }
  return {
    engine: "liblouis",
    output: value["output"],
    status: value["status"],
    tables,
    version: value["version"],
  };
}

function parseVerdict(
  value: unknown,
): DisagreementVerdict | InvalidDisagreementLedger {
  if (!isRecord(value)) {
    return invalid("verdict must be an object");
  }
  const extra = unknownField(value, verdictFields);
  if (extra !== undefined) {
    return invalid(`unknown verdict field: ${extra}`);
  }
  const kind = value["kind"];
  if (
    kind !== "our-bug" &&
    kind !== "liblouis-bug" &&
    kind !== "permitted-alternative"
  ) {
    return invalid("verdict.kind must be our-bug, liblouis-bug, or permitted-alternative");
  }
  const rationale = value["rationale"];
  if (!isNonEmptyString(rationale)) {
    return invalid("verdict.rationale must be a non-empty string");
  }
  const sources = value["sources"];
  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    !sources.every((source) => isNonEmptyString(source) && isOfficialSource(source))
  ) {
    return invalid("verdict.sources must contain only official ICEB or BANA URLs");
  }
  return { kind, rationale, sources };
}

function parseEntry(
  value: unknown,
): DisagreementLedgerEntry | InvalidDisagreementLedger {
  if (!isRecord(value)) {
    return invalid("disagreement must be an object");
  }
  const extra = unknownField(value, entryFields);
  if (extra !== undefined) {
    return invalid(`unknown disagreement field: ${extra}`);
  }
  const caseId = value["caseId"];
  if (!isNonEmptyString(caseId)) {
    return invalid("caseId must be a non-empty string");
  }
  const input = value["input"];
  if (typeof input !== "string") {
    return invalid("input must be a string");
  }
  const local = parseLocal(value["local"]);
  if ("ok" in local) {
    return local;
  }
  const oracle = parseOracle(value["oracle"]);
  if ("ok" in oracle) {
    return oracle;
  }
  const verdict = parseVerdict(value["verdict"]);
  if ("ok" in verdict) {
    return verdict;
  }
  return { caseId, input, local, oracle, verdict };
}

export function parseDisagreementLedger(
  value: unknown,
): DisagreementLedgerParseResult {
  if (!isRecord(value)) {
    return invalid("ledger must be an object");
  }
  const extra = unknownField(value, ledgerFields);
  if (extra !== undefined) {
    return invalid(`unknown ledger field: ${extra}`);
  }
  if (value["version"] !== 1) {
    return invalid("version must be 1");
  }
  const sourceEntries = value["disagreements"];
  if (!Array.isArray(sourceEntries)) {
    return invalid("disagreements must be an array");
  }
  const disagreements: DisagreementLedgerEntry[] = [];
  const caseIds = new Set<string>();
  for (const sourceEntry of sourceEntries) {
    const entry = parseEntry(sourceEntry);
    if ("ok" in entry) {
      return entry;
    }
    if (caseIds.has(entry.caseId)) {
      return invalid(`duplicate disagreement caseId: ${entry.caseId}`);
    }
    caseIds.add(entry.caseId);
    disagreements.push(entry);
  }
  return { ledger: { disagreements, version: 1 }, ok: true };
}

function evidenceKey(evidence: ComparisonEvidence): string {
  const local = evidence.local.kind === "rule"
    ? ["rule", evidence.local.ruleId, evidence.local.output]
    : ["test", evidence.local.testId, evidence.local.output];
  return JSON.stringify([
    evidence.caseId,
    evidence.input,
    local,
    evidence.oracle.engine,
    evidence.oracle.output,
    evidence.oracle.status,
    evidence.oracle.tables,
    evidence.oracle.version,
  ]);
}

export function reconcileDisagreements(
  comparisons: readonly OracleComparison[],
  ledger: DisagreementLedger,
): DisagreementReconciliation {
  const actual = comparisons
    .filter((comparison) => !comparison.ok)
    .map((comparison) => comparison.evidence);
  const actualKeys = new Set(actual.map(evidenceKey));
  const ledgerKeys = new Set(ledger.disagreements.map(evidenceKey));
  const untriaged = actual.filter((evidence) => !ledgerKeys.has(evidenceKey(evidence)));
  const stale = ledger.disagreements.filter(
    (entry) => !actualKeys.has(evidenceKey(entry)),
  );
  return {
    ok: untriaged.length === 0 && stale.length === 0,
    stale,
    untriaged,
  };
}
