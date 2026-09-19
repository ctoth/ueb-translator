import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { buildDocumentRecord } from "../corpus-benchmark/src/corpus.js";
import { createManifest, parseManifest, stringifyManifest } from "../corpus-benchmark/src/manifest.js";
import { extractGutenbergBody } from "../corpus-benchmark/src/text.js";

async function main(): Promise<void> {
  const [id, cache = ".corpus-cache", ...extra] = process.argv.slice(2);
  if (id === undefined || !/^[1-9]\d*$/u.test(id) || extra.length > 0) {
    throw new Error("usage: oracle:corpus:prepare-book POSITIVE_EBOOK_ID [CACHE_DIRECTORY]");
  }
  const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gutenberg download failed: HTTP ${String(response.status)}`);
  const raw = Buffer.from(await response.arrayBuffer());
  const rawSha256 = createHash("sha256").update(raw).digest("hex");
  const text = extractGutenbergBody(raw.toString("utf8"));
  if (text.length === 0) throw new Error("Gutenberg extraction returned no text");
  const root = resolve(cache, "prepared", `gutenberg-${id}-${rawSha256}`);
  const relativePath = "documents/00000000.txt";
  const document = buildDocumentRecord({ id: `gutenberg:ebook-${id}`, relativePath, text });
  const manifest = stringifyManifest(createManifest({ documents: [document], source: {
    kind: "gutenberg", harvestUrl: url, snapshot: `ebook-${id}-sha256-${rawSha256}`,
  } }));
  await mkdir(join(root, "documents"), { recursive: true });
  // Reusing identical artifacts is safe; differing retained bytes are never overwritten.
  for (const [path, bytes] of [
    ["raw.txt", raw], [relativePath, Buffer.from(text)], ["manifest.json", Buffer.from(manifest)],
  ] as const) {
    const destination = join(root, path);
    try {
      await writeFile(destination, bytes, { flag: "wx" });
    } catch (error: unknown) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
      const retained = await readFile(destination);
      const equal = path === "manifest.json"
        ? isDeepStrictEqual(parseManifest(retained.toString("utf8")), parseManifest(bytes.toString("utf8")))
        : retained.equals(bytes);
      if (!equal) {
        throw new Error(`Retained corpus artifact differs: ${destination}`, { cause: error });
      }
    }
  }
  console.log(JSON.stringify({ id, root, rawSha256, source: url, utf8Bytes: document.utf8Bytes }));
}

await main();
