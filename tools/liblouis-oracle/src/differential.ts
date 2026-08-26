import type { OracleMode } from "./protocol.js";
import type { OracleTranslation } from "./runner.js";

export interface LocalRuleEvidence {
  readonly kind: "rule";
  readonly ruleId: string;
}

export interface LocalTestEvidence {
  readonly kind: "test";
  readonly testId: string;
}

export type LocalEvidence = LocalRuleEvidence | LocalTestEvidence;

export interface DifferentialCase {
  readonly caseId: string;
  readonly local: LocalEvidence;
  readonly localOutput: string;
  readonly mode: OracleMode;
  readonly print: string;
}

export interface InvalidDifferentialCase {
  readonly error: string;
  readonly ok: false;
}

export interface ValidDifferentialCase {
  readonly case: DifferentialCase;
  readonly ok: true;
}

export type DifferentialCaseParseResult =
  | InvalidDifferentialCase
  | ValidDifferentialCase;

interface RuleComparisonEvidence extends LocalRuleEvidence {
  readonly output: string;
}

interface TestComparisonEvidence extends LocalTestEvidence {
  readonly output: string;
}

type LocalComparisonEvidence = RuleComparisonEvidence | TestComparisonEvidence;

interface OracleComparisonEvidence {
  readonly engine: "liblouis";
  readonly output: string;
  readonly status: string;
  readonly tables: readonly string[];
  readonly version: string;
}

export interface ComparisonEvidence {
  readonly caseId: string;
  readonly input: string;
  readonly local: LocalComparisonEvidence;
  readonly oracle: OracleComparisonEvidence;
}

export interface OracleAgreement {
  readonly evidence: ComparisonEvidence;
  readonly kind: "agreement";
  readonly ok: true;
}

export interface OracleDisagreement {
  readonly error: {
    readonly code: "translation-disagreement";
    readonly message: string;
  };
  readonly evidence: ComparisonEvidence;
  readonly kind: "disagreement";
  readonly ok: false;
}

export type OracleComparison = OracleAgreement | OracleDisagreement;

const caseFields: ReadonlySet<string> = new Set([
  "caseId",
  "local",
  "localOutput",
  "mode",
  "print",
]);
const ruleFields: ReadonlySet<string> = new Set(["kind", "ruleId"]);
const testFields: ReadonlySet<string> = new Set(["kind", "testId"]);
const jsonParser: { parse(text: string): unknown } = JSON;

function invalid(error: string): InvalidDifferentialCase {
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

function parseLocalEvidence(value: unknown): InvalidDifferentialCase | LocalEvidence {
  if (!isRecord(value)) {
    return invalid("local must be a JSON object");
  }
  const kind = value["kind"];
  if (kind === "rule") {
    const extra = unknownField(value, ruleFields);
    if (extra !== undefined) {
      return invalid(`unknown rule evidence field: ${extra}`);
    }
    const ruleId = value["ruleId"];
    if (typeof ruleId !== "string" || ruleId.length === 0) {
      return invalid("ruleId must be a non-empty string");
    }
    return { kind, ruleId };
  }
  if (kind === "test") {
    const extra = unknownField(value, testFields);
    if (extra !== undefined) {
      return invalid(`unknown test evidence field: ${extra}`);
    }
    const testId = value["testId"];
    if (typeof testId !== "string" || testId.length === 0) {
      return invalid("testId must be a non-empty string");
    }
    return { kind, testId };
  }
  return invalid("local.kind must be rule or test");
}

function isMode(value: unknown): value is OracleMode {
  return value === "grade1" || value === "grade2" || value === "technical";
}

export function parseDifferentialCase(value: unknown): DifferentialCaseParseResult {
  if (!isRecord(value)) {
    return invalid("case must be a JSON object");
  }
  const extra = unknownField(value, caseFields);
  if (extra !== undefined) {
    return invalid(`unknown case field: ${extra}`);
  }
  const caseId = value["caseId"];
  if (typeof caseId !== "string" || caseId.length === 0) {
    return invalid("caseId must be a non-empty string");
  }
  const local = parseLocalEvidence(value["local"]);
  if ("ok" in local) {
    return local;
  }
  const localOutput = value["localOutput"];
  if (typeof localOutput !== "string") {
    return invalid("localOutput must be a string");
  }
  const mode = value["mode"];
  if (!isMode(mode)) {
    return invalid("mode must be grade1, grade2, or technical");
  }
  const print = value["print"];
  if (typeof print !== "string") {
    return invalid("print must be a string");
  }
  if (print.includes("\u0000")) {
    return invalid("print must not contain U+0000");
  }
  return {
    case: { caseId, local, localOutput, mode, print },
    ok: true,
  };
}

export function parseDifferentialCaseLine(
  line: string,
): DifferentialCaseParseResult {
  let value: unknown;
  try {
    value = jsonParser.parse(line);
  } catch {
    return invalid("case must be valid JSON");
  }
  return parseDifferentialCase(value);
}

function localComparisonEvidence(case_: DifferentialCase): LocalComparisonEvidence {
  switch (case_.local.kind) {
    case "rule":
      return {
        kind: "rule",
        output: case_.localOutput,
        ruleId: case_.local.ruleId,
      };
    case "test":
      return {
        kind: "test",
        output: case_.localOutput,
        testId: case_.local.testId,
      };
  }
}

function localDescription(local: LocalEvidence): string {
  return local.kind === "rule"
    ? `local rule ${local.ruleId}`
    : `local test ${local.testId}`;
}

export function compareOracleTranslation(
  case_: DifferentialCase,
  translation: OracleTranslation,
): OracleComparison {
  if (translation.id !== case_.caseId) {
    throw new Error(
      `oracle response ${translation.id} does not match local case ${case_.caseId}`,
    );
  }
  const evidence: ComparisonEvidence = {
    caseId: case_.caseId,
    input: case_.print,
    local: localComparisonEvidence(case_),
    oracle: {
      ...translation.oracle,
      output: translation.output,
    },
  };
  if (case_.localOutput === translation.output) {
    return { evidence, kind: "agreement", ok: true };
  }
  return {
    error: {
      code: "translation-disagreement",
      message: `${case_.caseId} disagrees at ${localDescription(case_.local)}; adjudicate against ICEB`,
    },
    evidence,
    kind: "disagreement",
    ok: false,
  };
}
