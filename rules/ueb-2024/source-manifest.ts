import manifest from "./sources.json" with { type: "json" };
import { SOURCE_FILES } from "./source-files.js";

export function sourceFile(name: string): unknown {
  if (!Object.hasOwn(SOURCE_FILES, name)) throw new Error(`Unknown rule source file: ${name}`);
  return SOURCE_FILES[name];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assembleSources(
  tree: unknown, read: (file: string) => unknown,
): Readonly<Record<string, unknown>> {
  if (!isRecord(tree)) throw new Error("Expected a source group.");
  return Object.fromEntries(Object.entries(tree).map(([key, entry]) => [
    key, typeof entry === "string" ? read(entry) : assembleSources(entry, read),
  ]));
}

/** Routed sources sit beside the citation documents and the expanded symbols, never in their place. */
export function routedSources(sources: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  if (Object.hasOwn(sources, "documents") || Object.hasOwn(sources, "symbols")) {
    throw new Error("Routed sources cannot replace documents or expanded symbols.");
  }
  return sources;
}
const SOURCE_DATA: Readonly<Record<string, unknown>> = assembleSources(routedSources(manifest.sources), sourceFile);

export function sourceData(...path: readonly string[]): unknown {
  let node: unknown = SOURCE_DATA;
  for (const key of path) {
    if (!isRecord(node) || !Object.hasOwn(node, key)) {
      throw new Error(`Unknown rule source: ${path.join(".")}`);
    }
    node = node[key];
  }
  return node;
}

function entries(value: unknown, label: string): readonly (readonly [string, unknown])[] {
  if (!isRecord(value)) throw new Error(`Expected ${label} to be a record.`);
  return Object.entries(value);
}

/** Every citation document lives at the official host its authority declares in citation-authorities.json. */
export function officialDocuments(documents: unknown, authorities: unknown): unknown {
  const hosts = new Map<unknown, unknown>(entries(authorities, "citation authorities"));
  for (const [key, document] of entries(documents, "citation documents")) {
    const fields = new Map(entries(document, `citation document ${key}`));
    const host = hosts.get(fields.get("authority")), url = fields.get("url");
    if (typeof host !== "string" || typeof url !== "string" || !url.startsWith(host)) {
      throw new Error(`Citation document ${key} is not at its authority's official host.`);
    }
  }
  return documents;
}

export const CITATION_DOCUMENT_DATA: unknown = officialDocuments(sourceFile(manifest.documents), sourceFile(manifest.authorities));
export const SYMBOL_FAMILY_DATA: unknown = manifest.symbols;
