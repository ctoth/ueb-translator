import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseManifest, type CorpusManifest } from "../../corpus-benchmark/src/manifest.js";
import { verifyDocumentRecord } from "../../corpus-benchmark/src/corpus.js";
import { compareCorpusDocuments } from "./corpus-comparison.js";

function readVerifiedManifest(root: string): CorpusManifest {
  const manifest = parseManifest(readFileSync(resolve(root, "manifest.json"), "utf8"));
  for (const document of manifest.documents) {
    const text = readFileSync(resolve(root, document.relativePath), "utf8");
    if (!verifyDocumentRecord(document, text)) {
      throw new Error(`Corpus document digest mismatch: ${document.id}`);
    }
  }
  return manifest;
}

try {
  const [beforePath, afterPath, ...extra] = process.argv.slice(2);
  if (beforePath === undefined || afterPath === undefined || extra.length > 0) {
    throw new Error("usage: oracle:corpus:compare BEFORE_DIRECTORY AFTER_DIRECTORY");
  }
  const before = readVerifiedManifest(beforePath), after = readVerifiedManifest(afterPath);
  console.log(JSON.stringify({ before: before.source, after: after.source,
    ...compareCorpusDocuments(before.documents, after.documents) }));
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
