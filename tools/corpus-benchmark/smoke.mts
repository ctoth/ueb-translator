import { translateGrade2 } from "../../src/grade2.js";
import { prepareEpub, prepareGutenberg, prepareWikinews } from "./prepare.mjs";
import { benchmarkDocuments } from "./src/benchmark.js";
import { parseCommand } from "./src/command.js";

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

console.log("Corpus benchmark runtime imports loaded.");
