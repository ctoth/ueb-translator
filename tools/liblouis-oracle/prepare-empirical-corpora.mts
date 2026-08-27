import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { prepareWikinews } from "../corpus-benchmark/prepare.mjs";
import { buildDocumentRecord } from "../corpus-benchmark/src/corpus.js";
import {
  createManifest,
  stringifyManifest,
} from "../corpus-benchmark/src/manifest.js";
import { extractGutenbergBody } from "../corpus-benchmark/src/text.js";

const GUTENBERG = {
  id: "gutenberg:ebook-1342",
  rawSha256: "74f2665d6e6925fc2c17dec644bec9e87df478a0f1836822125e8acbb3777806",
  url: "https://www.gutenberg.org/cache/epub/1342/pg1342.txt",
} as const;
const WIKINEWS_SNAPSHOT = "20260801";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function download(url: string, path: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${String(response.status)}: ${url}`);
  }
  await writeFile(path, new Uint8Array(await response.arrayBuffer()), { flag: "wx" });
}

async function preparePinnedGutenberg(cache: string): Promise<string> {
  const downloadDirectory = join(cache, "downloads", "gutenberg");
  const rawPath = join(downloadDirectory, `${GUTENBERG.rawSha256}.txt`);
  const target = join(cache, "prepared", `gutenberg-1342-${GUTENBERG.rawSha256}`);
  if (await exists(join(target, "manifest.json"))) {
    return target;
  }
  await mkdir(downloadDirectory, { recursive: true });
  if (!(await exists(rawPath))) {
    await download(GUTENBERG.url, rawPath);
  }
  const raw = await readFile(rawPath);
  const digest = createHash("sha256").update(raw).digest("hex");
  if (digest !== GUTENBERG.rawSha256) {
    throw new Error(
      `Retained Gutenberg bytes changed: expected ${GUTENBERG.rawSha256}, received ${digest}.`,
    );
  }
  const text = extractGutenbergBody(raw.toString("utf8"));
  const relativePath = "documents/00000000.txt";
  const document = buildDocumentRecord({
    id: GUTENBERG.id,
    relativePath,
    text,
  });
  await mkdir(join(target, "documents"), { recursive: true });
  await writeFile(join(target, relativePath), text, "utf8");
  await writeFile(join(target, "manifest.json"), stringifyManifest(createManifest({
    documents: [document],
    source: {
      harvestUrl: GUTENBERG.url,
      kind: "gutenberg",
      snapshot: `ebook-1342-sha256-${GUTENBERG.rawSha256}`,
    },
  })));
  return target;
}

async function main(): Promise<void> {
  const cache = resolve(process.argv[2] ?? ".corpus-cache");
  const gutenberg = await preparePinnedGutenberg(cache);
  const expectedWikinews = join(cache, "prepared", `wikinews-${WIKINEWS_SNAPSHOT}`);
  const wikinews = await exists(join(expectedWikinews, "manifest.json"))
    ? expectedWikinews
    : await prepareWikinews({
      cacheDirectory: cache,
      kind: "prepare-wikinews",
      snapshot: WIKINEWS_SNAPSHOT,
    });
  console.log(JSON.stringify({ gutenberg, wikinews }));
}

await main();
