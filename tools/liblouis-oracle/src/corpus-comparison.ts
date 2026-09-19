import type { CorpusDocumentRecord } from "../../corpus-benchmark/src/corpus.js";

function indexDocuments(documents: readonly CorpusDocumentRecord[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const document of documents) {
    if (result.has(document.id)) throw new Error(`Duplicate document ID: ${document.id}`);
    result.set(document.id, document.sha256);
  }
  return result;
}

export function compareCorpusDocuments(
  before: readonly CorpusDocumentRecord[],
  after: readonly CorpusDocumentRecord[],
): {
  readonly added: readonly string[];
  readonly changed: readonly string[];
  readonly identical: boolean;
  readonly removed: readonly string[];
  readonly unchanged: number;
} {
  const previous = indexDocuments(before);
  const current = indexDocuments(after);
  const added: string[] = [], changed: string[] = [], removed: string[] = [];
  let unchanged = 0;
  for (const [id, digest] of current) {
    if (!previous.has(id)) added.push(id);
    else if (previous.get(id) !== digest) changed.push(id);
    else unchanged += 1;
  }
  for (const id of previous.keys()) {
    if (!current.has(id)) removed.push(id);
  }
  return { added: added.sort(), changed: changed.sort(), removed: removed.sort(),
    unchanged, identical: added.length + changed.length + removed.length === 0 };
}
