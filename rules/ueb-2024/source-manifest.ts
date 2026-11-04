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

const SOURCE_DATA: Readonly<Record<string, unknown>> = assembleSources(manifest.sources, sourceFile);

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

export const CITATION_DOCUMENT_DATA: unknown = sourceFile(manifest.documents);
export const SYMBOL_FAMILY_DATA: unknown = manifest.symbols;
