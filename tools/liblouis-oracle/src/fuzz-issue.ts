export interface FuzzFailure {
  readonly counterexample: readonly [string];
  readonly counterexamplePath: string;
  readonly evidence: {
    readonly input: string;
    readonly local: { readonly output: string };
    readonly oracle: { readonly output: string; readonly version: string };
  };
  readonly fingerprint: string;
  readonly numShrinks: number;
  readonly ok: false;
  readonly seed: number;
}

export type FuzzResult =
  | { readonly kind: "divergence"; readonly failure: FuzzFailure }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "passed"; readonly numRuns: number; readonly seed: number };

export type GhRunner = (arguments_: readonly string[]) => string;

interface ExistingIssue {
  readonly number: number;
  readonly open: boolean;
  readonly url: string;
}

const jsonParser: { parse(source: string): unknown } = JSON;

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isFuzzFailure(value: object): value is FuzzFailure {
  return "ok" in value && value.ok === false &&
    "fingerprint" in value && typeof value.fingerprint === "string" &&
    "evidence" in value && typeof value.evidence === "object" && value.evidence !== null;
}

export function classifyFuzzResult(value: unknown): FuzzResult {
  if (typeof value === "object" && value !== null && "ok" in value) {
    if (isFuzzFailure(value)) {
      return { failure: value, kind: "divergence" };
    }
    if (value.ok === false && "error" in value && typeof value.error === "string") {
      return { kind: "error", message: value.error };
    }
    if (
      value.ok === true &&
      "numRuns" in value && typeof value.numRuns === "number" &&
      "seed" in value && typeof value.seed === "number"
    ) {
      return { kind: "passed", numRuns: value.numRuns, seed: value.seed };
    }
  }
  throw new Error("Unrecognized fuzz result.");
}

function evidenceLines(value: FuzzFailure): readonly string[] {
  return [
    `- Seed: \`${String(value.seed)}\``,
    `- Replay path: \`${value.counterexamplePath}\``,
    `- Shrinks: \`${String(value.numShrinks)}\``,
    `- Minimal print input: \`${JSON.stringify(value.evidence.input)}\``,
    `- Local output: \`${value.evidence.local.output}\``,
    `- Liblouis ${value.evidence.oracle.version}: \`${value.evidence.oracle.output}\``,
  ];
}

export function describeFuzzResult(result: FuzzResult): string {
  switch (result.kind) {
    case "passed":
      return `No unledgered divergence in ${String(result.numRuns)} cases (seed ${String(result.seed)}).`;
    case "error":
      return `Fuzz infrastructure error: ${result.message}`;
    case "divergence":
      return [
        "Unledgered divergence:",
        `- Fingerprint: \`${result.failure.fingerprint}\``,
        ...evidenceLines(result.failure),
      ].join("\n");
  }
}

function parseExistingIssues(source: string): readonly ExistingIssue[] {
  const value = jsonParser.parse(source);
  if (!isUnknownArray(value)) {
    throw new Error("GitHub issue list response must be an array.");
  }
  const issues: ExistingIssue[] = [];
  for (const entry of value) {
    if (
      typeof entry !== "object" || entry === null ||
      !("number" in entry) || typeof entry.number !== "number" ||
      !("state" in entry) || (entry.state !== "OPEN" && entry.state !== "CLOSED") ||
      !("url" in entry) || typeof entry.url !== "string" || entry.url.length === 0
    ) {
      throw new Error("GitHub issue list entry must include a number, state, and URL.");
    }
    issues.push({ number: entry.number, open: entry.state === "OPEN", url: entry.url });
  }
  return issues;
}

export function fileFuzzDivergence(
  value: FuzzFailure,
  repository: string,
  runGh: GhRunner,
): string {
  const marker = `ueb-divergence:${value.fingerprint}`;
  const existing = parseExistingIssues(runGh([
    "issue", "list", "--repo", repository, "--state", "all",
    "--search", `"${marker}" in:body`, "--json", "number,state,url",
  ]));
  const open = existing.find((issue) => issue.open);
  if (open !== undefined) {
    return open.url;
  }
  const closed = existing[0];
  if (closed !== undefined) {
    runGh([
      "issue", "reopen", String(closed.number), "--repo", repository,
      "--comment", [
        "Nightly differential fuzzing found this closed divergence again.",
        "",
        ...evidenceLines(value),
      ].join("\n"),
    ]);
    return closed.url;
  }
  const body = [
    "Nightly differential fuzzing found a new minimal Liblouis disagreement.",
    "",
    `- Fingerprint: \`${value.fingerprint}\``,
    ...evidenceLines(value),
    "",
    "This is differential evidence only. Adjudicate against the official ICEB/BANA sources before changing translator behavior.",
    "",
    `<!-- ${marker} -->`,
  ].join("\n");
  return runGh([
    "issue", "create", "--repo", repository,
    "--title", `Oracle divergence: ${value.fingerprint.slice(0, 12)}`,
    "--body", body,
  ]).trim();
}
