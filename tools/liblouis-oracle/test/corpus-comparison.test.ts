import { describe, expect, it } from "vitest";
import { compareCorpusDocuments } from "../src/corpus-comparison.js";
import { buildDocumentRecord } from "../../corpus-benchmark/src/corpus.js";

const document = (id: string, text: string) =>
  buildDocumentRecord({ id, text, relativePath: `${id}.txt` });

describe("corpus snapshot comparison", () => {
  it("reports added, removed, changed and unchanged documents by source identity", () => {
    expect(compareCorpusDocuments(
      [document("same", "x"), document("changed", "before"), document("gone", "x")],
      [document("same", "x"), document("changed", "after"), document("new", "x")],
    )).toEqual({ added: ["new"], removed: ["gone"], changed: ["changed"],
      unchanged: 1, identical: false });
  });
  it("recognizes identical content independently of document order", () => {
    const a = document("a", "same"), b = document("b", "same");
    expect(compareCorpusDocuments([a, b], [b, a])).toMatchObject({ identical: true, unchanged: 2 });
  });
  it("rejects duplicate source IDs instead of collapsing them", () => {
    expect(() => compareCorpusDocuments([document("a", "x"), document("a", "y")], []))
      .toThrow("Duplicate document ID");
    expect(() => compareCorpusDocuments([], [document("a", "x"), document("a", "y")]))
      .toThrow("Duplicate document ID");
  });
});
