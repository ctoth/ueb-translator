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

export type GhRunner = (arguments_: readonly string[]) => string;

const jsonParser: { parse(source: string): unknown } = JSON;

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

export function isFuzzFailure(value: unknown): value is FuzzFailure {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("ok" in value) || !("fingerprint" in value) || !("evidence" in value)) {
    return false;
  }
  return value.ok === false &&
    typeof value.fingerprint === "string" &&
    typeof value.evidence === "object" && value.evidence !== null;
}

function parseExistingIssueUrls(source: string): readonly string[] {
  const value = jsonParser.parse(source);
  if (!isUnknownArray(value)) {
    throw new Error("GitHub issue list response must be an array.");
  }
  const urls: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("GitHub issue list entry must be an object.");
    }
    if (!("url" in entry) || typeof entry.url !== "string" || entry.url.length === 0) {
      throw new Error("GitHub issue list entry must include a URL.");
    }
    urls.push(entry.url);
  }
  return urls;
}

export function fileFuzzDivergence(
  value: FuzzFailure,
  repository: string,
  runGh: GhRunner,
): string {
  const marker = `ueb-divergence:${value.fingerprint}`;
  const existing = parseExistingIssueUrls(runGh([
    "issue", "list", "--repo", repository, "--state", "all",
    "--search", `"${marker}" in:body`, "--json", "number,url",
  ]));
  if (existing.length > 0) {
    return existing[0] ?? marker;
  }
  const body = [
    "Nightly differential fuzzing found a new minimal Liblouis disagreement.",
    "",
    `- Fingerprint: \`${value.fingerprint}\``,
    `- Seed: \`${String(value.seed)}\``,
    `- Replay path: \`${value.counterexamplePath}\``,
    `- Shrinks: \`${String(value.numShrinks)}\``,
    `- Minimal print input: \`${JSON.stringify(value.evidence.input)}\``,
    `- Local output: \`${value.evidence.local.output}\``,
    `- Liblouis ${value.evidence.oracle.version}: \`${value.evidence.oracle.output}\``,
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
