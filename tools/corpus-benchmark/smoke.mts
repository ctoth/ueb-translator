import { translateGrade2 } from "../../src/grade2.js";
import { prepareEpub, prepareGutenberg, prepareWikinews } from "./prepare.mjs";
import { benchmarkDocuments } from "./src/benchmark.js";
import { parseCommand } from "./src/command.js";
import { buildDocumentRecord } from "./src/corpus.js";

const imports = [
  benchmarkDocuments,
  parseCommand,
  prepareEpub,
  prepareGutenberg,
  prepareWikinews,
  translateGrade2,
];

if (imports.some((imported) => typeof imported !== "function")) {
  throw new Error("Corpus benchmark runtime imports are incomplete.");
}

const command = parseCommand([
  "benchmark",
  "--corpus",
  "fixture",
  "--partition",
  "held-out",
]);
if (
  command.kind !== "benchmark" ||
  command.corpusDirectory !== "fixture" ||
  command.partition !== "held-out"
) {
  throw new Error("Corpus benchmark command parsing failed.");
}

const document = buildDocumentRecord({
  id: "smoke",
  relativePath: "documents/smoke.txt",
  text: "and",
});
let clock = 0;
const benchmark = benchmarkDocuments({
  clock: () => {
    const current = clock;
    clock += 1_000;
    return current;
  },
  documents: [document],
  memoryUsage: () => ({ heapUsed: 1, rss: 2 }),
  readText: () => "and",
  translate: translateGrade2,
});
if (
  benchmark.documents !== 1 ||
  benchmark.inputUtf8Bytes !== 3 ||
  benchmark.outputCells !== 1 ||
  benchmark.translatedDocuments !== 1 ||
  benchmark.unsupportedDocuments !== 0
) {
  throw new Error("Corpus benchmark behavior check failed.");
}

console.log(JSON.stringify({ benchmark: "verified", command: "verified" }));
