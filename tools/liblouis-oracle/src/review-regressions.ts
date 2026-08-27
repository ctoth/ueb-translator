import type { OracleMode } from "./protocol.js";

export interface ReviewRegressionCase {
  readonly caseId: string;
  readonly issue: number;
  readonly mode: OracleMode | "structured-grade1" | "structured-grade2" | "structured-technical";
  readonly preFix: true;
  readonly probe: string;
}

export const REVIEW_REGRESSION_CASES: readonly ReviewRegressionCase[] = [
  { caseId: "review:22:standalone-letter", issue: 22, mode: "grade2", preFix: true, probe: "b" },
  { caseId: "review:26:question-context", issue: 26, mode: "grade2", preFix: true, probe: "was?" },
  { caseId: "review:28:capitals-passage", issue: 28, mode: "grade2", preFix: true, probe: "THE CAT SAT ON" },
  { caseId: "review:29:capitals-newline", issue: 29, mode: "grade1", preFix: true, probe: "AB CD\nEF GH IJ KL" },
  { caseId: "review:29:capitals-apostrophe", issue: 29, mode: "grade1", preFix: true, probe: "DON'T" },
  { caseId: "review:30:mixed-case", issue: 30, mode: "grade2", preFix: true, probe: "PowerPoint" },
  { caseId: "review:34:technical-numeric-letter", issue: 34, mode: "structured-technical", preFix: true, probe: "sequence(number(1), identifier(a)); all-technical" },
  { caseId: "review:34:technical-radical", issue: 34, mode: "structured-technical", preFix: true, probe: "radical(number(9)); preferred" },
  { caseId: "review:35:technical-capital", issue: 35, mode: "structured-technical", preFix: true, probe: "identifier(X); preferred" },
  { caseId: "review:35:technical-element", issue: 35, mode: "structured-technical", preFix: true, probe: "chemical-element(H); preferred" },
  { caseId: "review:36:technical-enclosure", issue: 36, mode: "structured-technical", preFix: true, probe: "group(identifier(ab)); preferred" },
  { caseId: "review:44:typeform-symbol", issue: 44, mode: "structured-grade1", preFix: true, probe: "italic(a b)" },
  { caseId: "review:45:grade2-typeform-api", issue: 45, mode: "structured-grade2", preFix: true, probe: "italic(contracted text)" },
] as const;

interface ReviewRegressionInput {
  readonly adapter: string;
  readonly value: unknown;
}

interface ReviewRegressionActual {
  readonly kind: "actual";
  readonly output: string;
}

interface ReviewRegressionAssertion {
  readonly expected: string;
  readonly kind: "assertion";
  readonly observed: string;
}

interface ReviewLiblouisOracle {
  readonly kind: "liblouis";
  readonly mode: OracleMode;
  readonly output: string;
  readonly version: "3.38.0";
}

interface ReviewUnrepresentableOracle {
  readonly kind: "unrepresentable";
  readonly reason: string;
}

export interface ReviewRegressionEvidence {
  readonly caseId: string;
  readonly evidence: ReviewRegressionActual | ReviewRegressionAssertion;
  readonly input: ReviewRegressionInput;
  readonly issue: number;
  readonly oracle: ReviewLiblouisOracle | ReviewUnrepresentableOracle;
  readonly preFix: true;
  readonly sources: readonly string[];
}

export interface ReviewRegressionLedger {
  readonly capturedAtCommit: string;
  readonly cases: readonly ReviewRegressionEvidence[];
  readonly version: 1;
}

export type ReviewRegressionParseResult =
  | { readonly error: string; readonly ok: false }
  | { readonly ledger: ReviewRegressionLedger; readonly ok: true };

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseReviewRegressionLedger(
  value: unknown,
): ReviewRegressionParseResult {
  if (!isRecord(value) || value["version"] !== 1) {
    return { error: "review regression ledger must be a version-1 object", ok: false };
  }
  const capturedAtCommit = value["capturedAtCommit"];
  const cases = value["cases"];
  if (
    typeof capturedAtCommit !== "string" ||
    !/^[\da-f]{40}$/u.test(capturedAtCommit) ||
    !Array.isArray(cases)
  ) {
    return { error: "review regression ledger identity is incomplete", ok: false };
  }
  const parsed: ReviewRegressionEvidence[] = [];
  const identifiers = new Set<string>();
  for (const candidate of cases) {
    if (!isRecord(candidate)) {
      return { error: "review regression case must be an object", ok: false };
    }
    const caseId = candidate["caseId"];
    const issue = candidate["issue"];
    const input = candidate["input"];
    const evidence = candidate["evidence"];
    const oracle = candidate["oracle"];
    const sources = candidate["sources"];
    if (
      typeof caseId !== "string" || caseId.length === 0 || identifiers.has(caseId) ||
      !Number.isSafeInteger(issue) || candidate["preFix"] !== true ||
      !isRecord(input) || typeof input["adapter"] !== "string" || !("value" in input) ||
      !isRecord(evidence) || !isRecord(oracle) ||
      !Array.isArray(sources) || sources.length === 0 ||
      !sources.every((source) => typeof source === "string" && source.startsWith("https://"))
    ) {
      return { error: `invalid review regression case: ${String(caseId)}`, ok: false };
    }
    if (
      evidence["kind"] !== "actual" && evidence["kind"] !== "assertion"
    ) {
      return { error: `invalid review evidence: ${caseId}`, ok: false };
    }
    if (
      (evidence["kind"] === "actual" && typeof evidence["output"] !== "string") ||
      (evidence["kind"] === "assertion" &&
        (typeof evidence["observed"] !== "string" || typeof evidence["expected"] !== "string"))
    ) {
      return { error: `incomplete review evidence: ${caseId}`, ok: false };
    }
    if (
      (oracle["kind"] === "liblouis" &&
        (oracle["version"] !== "3.38.0" || typeof oracle["output"] !== "string" ||
          (oracle["mode"] !== "grade1" && oracle["mode"] !== "grade2" && oracle["mode"] !== "technical"))) ||
      (oracle["kind"] === "unrepresentable" && typeof oracle["reason"] !== "string") ||
      (oracle["kind"] !== "liblouis" && oracle["kind"] !== "unrepresentable")
    ) {
      return { error: `invalid review oracle: ${caseId}`, ok: false };
    }
    identifiers.add(caseId);
    // The closed-field and variant validation above establishes the serialized evidence contract.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    parsed.push(candidate as unknown as ReviewRegressionEvidence);
  }
  return {
    ledger: { capturedAtCommit, cases: parsed, version: 1 },
    ok: true,
  };
}
