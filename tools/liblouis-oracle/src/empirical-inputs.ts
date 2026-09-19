import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseManifest } from "../../corpus-benchmark/src/manifest.js";
import { verifyDocumentRecord } from "../../corpus-benchmark/src/corpus.js";
import { buildCorpusCases, buildDictionaryCase, parseScowlWordList } from "./empirical.js";
import type { DifferentialCase } from "./differential.js";

export function* loadCorpusCases(root: string, selectedCaseIds?: ReadonlySet<string>): Generator<DifferentialCase> {
  const corpusRoot = resolve(root);
  const manifest = parseManifest(readFileSync(resolve(corpusRoot, "manifest.json"), "utf8"));
  for (const document of manifest.documents) {
    const text = readFileSync(resolve(corpusRoot, document.relativePath), "utf8");
    if (!verifyDocumentRecord(document, text)) throw new Error(`Corpus document digest mismatch: ${document.id}`);
    yield* buildCorpusCases({ documentId: document.id, documentSha256: document.sha256, text }, selectedCaseIds);
  }
}

export function* loadEmpiricalCases(channel: string, paths: readonly string[], selectedCaseIds?: ReadonlySet<string>): Generator<DifferentialCase> {
  if (channel === "dictionary" && paths.length === 1) {
    for (const [index, word] of parseScowlWordList(readFileSync(resolve(paths[0] ?? ""), "utf8")).entries()) {
      yield buildDictionaryCase(word, index);
    }
  } else if (channel === "corpus" && paths.length > 0) {
    for (const root of paths) yield* loadCorpusCases(root, selectedCaseIds);
  } else throw new Error("Expected dictionary WORDLIST or corpus ROOT...");
}
