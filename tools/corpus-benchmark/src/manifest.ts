import {
  EXTRACTION_RULES_VERSION,
  type CorpusDocumentRecord,
} from "./corpus.js";

interface EpubSource {
  readonly calibreVersion: string;
  readonly kind: "epub";
  readonly license: "User-provided; not redistributed";
  readonly snapshot: string;
}

interface GutenbergSource {
  readonly harvestUrl: string;
  readonly kind: "gutenberg";
  readonly license: "Project Gutenberg License; individual ebook copyright status applies";
  readonly licenseUrl: "https://www.gutenberg.org/policy/license.html";
  readonly snapshot: string;
}

interface WikinewsSource {
  readonly archiveSha1: string;
  readonly archiveUrl: string;
  readonly attribution: "Wikinews contributors";
  readonly kind: "wikinews";
  readonly license: "Public domain, CC BY 2.5, or CC BY 4.0 according to publication date";
  readonly licenseUrl: "https://en.wikinews.org/wiki/Wikinews:Copyright";
  readonly snapshot: string;
}

export type CorpusSource = EpubSource | GutenbergSource | WikinewsSource;

export type CorpusSourceInput =
  | Omit<EpubSource, "license">
  | Omit<GutenbergSource, "license" | "licenseUrl">
  | Omit<WikinewsSource, "attribution" | "license" | "licenseUrl">;

export interface CorpusManifest {
  readonly documents: readonly CorpusDocumentRecord[];
  readonly extractionRulesVersion: 1;
  readonly partition: {
    readonly algorithm: "sha256-prefix-v1";
    readonly heldOutPrefixes: "00-32";
    readonly policy: "sealed-before-translation";
  };
  readonly schemaVersion: 1;
  readonly source: CorpusSource;
}

export interface ManifestInput {
  readonly documents: readonly CorpusDocumentRecord[];
  readonly source: CorpusSourceInput;
}

const PARTITION = {
  algorithm: "sha256-prefix-v1",
  heldOutPrefixes: "00-32",
  policy: "sealed-before-translation",
} as const;

function completeSource(source: CorpusSourceInput): CorpusSource {
  switch (source.kind) {
    case "epub":
      return {
        ...source,
        license: "User-provided; not redistributed",
      };
    case "gutenberg":
      return {
        ...source,
        license:
          "Project Gutenberg License; individual ebook copyright status applies",
        licenseUrl: "https://www.gutenberg.org/policy/license.html",
      };
    case "wikinews":
      return {
        ...source,
        attribution: "Wikinews contributors",
        license:
          "Public domain, CC BY 2.5, or CC BY 4.0 according to publication date",
        licenseUrl: "https://en.wikinews.org/wiki/Wikinews:Copyright",
      };
  }
}

export function createManifest(input: ManifestInput): CorpusManifest {
  return {
    documents: input.documents,
    extractionRulesVersion: EXTRACTION_RULES_VERSION,
    partition: PARTITION,
    schemaVersion: 1,
    source: completeSource(input.source),
  };
}

export function stringifyManifest(manifest: CorpusManifest): string {
  return `${JSON.stringify(manifest, undefined, 2)}\n`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function object(value: unknown, context: string): Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value;
}

function stringProperty(
  value: Record<string, unknown>,
  property: string,
  context: string,
): string {
  const candidate = value[property];
  if (typeof candidate !== "string") {
    throw new Error(`${context}.${property} must be a string.`);
  }
  return candidate;
}

function numberProperty(
  value: Record<string, unknown>,
  property: string,
  context: string,
): number {
  const candidate = value[property];
  if (typeof candidate !== "number" || !Number.isSafeInteger(candidate)) {
    throw new Error(`${context}.${property} must be a safe integer.`);
  }
  return candidate;
}

function literal(
  value: Record<string, unknown>,
  property: string,
  expected: string | number,
  context: string,
): void {
  if (value[property] !== expected) {
    throw new Error(`${context}.${property} must be ${String(expected)}.`);
  }
}

function parseDocument(value: unknown, index: number): CorpusDocumentRecord {
  const context = `manifest.documents[${String(index)}]`;
  const record = object(value, context);
  const partition = stringProperty(record, "partition", context);
  if (partition !== "held-out" && partition !== "training") {
    throw new Error(`${context}.partition is invalid.`);
  }
  return {
    id: stringProperty(record, "id", context),
    partition,
    relativePath: stringProperty(record, "relativePath", context),
    sha256: stringProperty(record, "sha256", context),
    utf8Bytes: numberProperty(record, "utf8Bytes", context),
  };
}

function parseSource(value: unknown): CorpusSourceInput {
  const source = object(value, "manifest.source");
  const kind = stringProperty(source, "kind", "manifest.source");
  const snapshot = stringProperty(source, "snapshot", "manifest.source");
  if (kind === "epub") {
    literal(
      source,
      "license",
      "User-provided; not redistributed",
      "manifest.source",
    );
    return {
      calibreVersion: stringProperty(
        source,
        "calibreVersion",
        "manifest.source",
      ),
      kind,
      snapshot,
    };
  }
  if (kind === "gutenberg") {
    literal(
      source,
      "license",
      "Project Gutenberg License; individual ebook copyright status applies",
      "manifest.source",
    );
    literal(
      source,
      "licenseUrl",
      "https://www.gutenberg.org/policy/license.html",
      "manifest.source",
    );
    return {
      harvestUrl: stringProperty(source, "harvestUrl", "manifest.source"),
      kind,
      snapshot,
    };
  }
  if (kind === "wikinews") {
    literal(
      source,
      "attribution",
      "Wikinews contributors",
      "manifest.source",
    );
    literal(
      source,
      "license",
      "Public domain, CC BY 2.5, or CC BY 4.0 according to publication date",
      "manifest.source",
    );
    literal(
      source,
      "licenseUrl",
      "https://en.wikinews.org/wiki/Wikinews:Copyright",
      "manifest.source",
    );
    return {
      archiveSha1: stringProperty(source, "archiveSha1", "manifest.source"),
      archiveUrl: stringProperty(source, "archiveUrl", "manifest.source"),
      kind,
      snapshot,
    };
  }
  throw new Error(`manifest.source.kind is unsupported: ${kind}.`);
}

export function parseManifest(json: string): CorpusManifest {
  const parsed: unknown = JSON.parse(json);
  const manifest = object(parsed, "manifest");
  literal(manifest, "schemaVersion", 1, "manifest");
  literal(
    manifest,
    "extractionRulesVersion",
    EXTRACTION_RULES_VERSION,
    "manifest",
  );
  const partition = object(manifest["partition"], "manifest.partition");
  if (partition["algorithm"] !== PARTITION.algorithm) {
    throw new Error("manifest partition algorithm is unsupported.");
  }
  literal(
    partition,
    "heldOutPrefixes",
    PARTITION.heldOutPrefixes,
    "manifest.partition",
  );
  literal(partition, "policy", PARTITION.policy, "manifest.partition");
  const documentsValue = manifest["documents"];
  if (!Array.isArray(documentsValue)) {
    throw new Error("manifest.documents must be an array.");
  }
  return createManifest({
    documents: documentsValue.map(parseDocument),
    source: parseSource(manifest["source"]),
  });
}
