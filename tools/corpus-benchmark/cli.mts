import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { memoryUsage, resourceUsage } from "node:process";

import { translateGrade2 } from "../../src/grade2.js";
import { benchmarkDocuments } from "./src/benchmark.js";
import { parseCommand } from "./src/command.js";
import { parseManifest } from "./src/manifest.js";
import { findRepositoryRoot } from "./src/repository.js";
import {
  prepareEpub,
  prepareGutenberg,
  prepareWikinews,
} from "./prepare.mjs";

function packageSizes(): unknown {
  const repositoryRoot = findRepositoryRoot(import.meta.url);
  const script = resolve(repositoryRoot, "scripts/report-size.mts");
  const json = execFileSync(process.execPath, [script], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  return JSON.parse(json);
}

function benchmark(
  corpusDirectory: string,
  partition: "held-out" | "training",
): void {
  const corpusRoot = resolve(corpusDirectory);
  const manifest = parseManifest(
    readFileSync(resolve(corpusRoot, "manifest.json"), "utf8"),
  );
  const documents = manifest.documents.filter(
    (document) => document.partition === partition,
  );
  const translation = benchmarkDocuments({
    clock: performance.now.bind(performance),
    documents,
    memoryUsage: () => ({
      heapUsed: memoryUsage().heapUsed,
      rss: resourceUsage().maxRSS * 1024,
    }),
    readText: (document) =>
      readFileSync(resolve(corpusRoot, document.relativePath), "utf8"),
    translate: translateGrade2,
  });
  console.log(
    JSON.stringify(
      {
        corpus: {
          extractionRulesVersion: manifest.extractionRulesVersion,
          partition,
          snapshot: manifest.source.snapshot,
          source: manifest.source.kind,
        },
        packageSizes: packageSizes(),
        translation,
      },
      undefined,
      2,
    ),
  );
}

const command = parseCommand(process.argv.slice(2));
switch (command.kind) {
  case "benchmark":
    benchmark(command.corpusDirectory, command.partition);
    break;
  case "prepare-epub":
    console.log(await prepareEpub(command));
    break;
  case "prepare-gutenberg":
    console.log(await prepareGutenberg(command));
    break;
  case "prepare-wikinews":
    console.log(await prepareWikinews(command));
    break;
}
