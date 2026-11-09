import { CITATION_DOCUMENT_DATA } from "./source-manifest.js";

/** A citation is a document from citation-documents.json plus the locator its source JSON names. */
export interface RuleCitation {
  readonly authority: string;
  readonly document: string;
  readonly locator: string;
  readonly url: string;
}
export type IcebRuleCitation = RuleCitation;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolve a document key and locator against citation-documents.json. */
export function cite(source: string, locator: string): RuleCitation {
  const documents = CITATION_DOCUMENT_DATA;
  const document = isRecord(documents) && Object.hasOwn(documents, source) ? documents[source] : undefined;
  if (!isRecord(document)) throw new Error(`Unknown citation document: ${source}`);
  const { authority, document: title, url } = document;
  if (typeof authority !== "string" || typeof title !== "string" || typeof url !== "string" ||
    locator.trim().length === 0) {
    throw new Error(`Malformed citation for ${source}.`);
  }
  return { authority, document: title, locator, url };
}

export function citeIceb(locator: string): IcebRuleCitation {
  return cite("ueb-2024", locator);
}
