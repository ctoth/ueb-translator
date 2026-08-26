import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { basename, join, relative, resolve, sep } from "node:path";

import {
  gutenbergHarvestUrl,
  parseSha1Sums,
  wikinewsArchive,
} from "./src/acquisition.js";
import type {
  PrepareEpubCommand,
  PrepareGutenbergCommand,
  PrepareWikinewsCommand,
} from "./src/command.js";
import {
  buildDocumentRecord,
  type CorpusDocumentRecord,
} from "./src/corpus.js";
import { createManifest, stringifyManifest } from "./src/manifest.js";
import {
  extractGutenbergBody,
  normalizeReadingText,
  readWikinewsPages,
} from "./src/text.js";

interface PreparedText {
  readonly id: string;
  readonly text: string;
}

function portablePath(path: string): string {
  return path.split(sep).join("/");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function filesBelow(root: string): Promise<readonly string[]> {
  const files: string[] = [];
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  }
  await visit(root);
  return files;
}

function run(
  executable: string,
  arguments_: readonly string[],
  options: { readonly cwd?: string; readonly quiet?: boolean } = {},
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, arguments_, {
      cwd: options.cwd,
      stdio: options.quiet === true ? "ignore" : "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(
          new Error(
            `${executable} exited with status ${code === null ? "signal" : String(code)}.`,
          ),
        );
      }
    });
  });
}

function output(executable: string, arguments_: readonly string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, arguments_, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise(stdout.trim());
      } else {
        reject(new Error(`${executable} failed: ${stderr.trim()}`));
      }
    });
  });
}

async function download(url: string, path: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${String(response.status)}: ${url}`);
  }
  await writeFile(path, new Uint8Array(await response.arrayBuffer()));
}

async function decompressBzip2(input: string, outputPath: string): Promise<void> {
  const child = spawn("bzip2", ["-dc", input], {
    stdio: ["ignore", "pipe", "inherit"],
    windowsHide: true,
  });
  const destination = createWriteStream(outputPath, { flags: "wx" });
  child.stdout.pipe(destination);
  const exited = new Promise<void>((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`bzip2 exited with status ${String(code)}.`));
      }
    });
  });
  await Promise.all([exited, finished(destination)]);
}

async function writePreparedTexts(
  stage: string,
  texts: readonly PreparedText[],
): Promise<readonly CorpusDocumentRecord[]> {
  const documentsDirectory = join(stage, "documents");
  await mkdir(documentsDirectory, { recursive: true });
  const records: CorpusDocumentRecord[] = [];
  const ids = new Set<string>();
  for (const [index, document] of texts.entries()) {
    if (ids.has(document.id)) {
      throw new Error(`Duplicate corpus document identifier: ${document.id}.`);
    }
    ids.add(document.id);
    const fileName = `${String(index).padStart(8, "0")}.txt`;
    const relativePath = `documents/${fileName}`;
    await writeFile(join(documentsDirectory, fileName), document.text, "utf8");
    records.push(
      buildDocumentRecord({
        id: document.id,
        relativePath,
        text: document.text,
      }),
    );
  }
  if (records.length === 0) {
    throw new Error("Corpus preparation produced no semantic reading text.");
  }
  return records;
}

async function stageCorpus(
  cacheDirectory: string,
  name: string,
  prepare: (stage: string) => Promise<void>,
): Promise<string> {
  const cache = resolve(cacheDirectory);
  const preparedRoot = join(cache, "prepared");
  const target = join(preparedRoot, name);
  await mkdir(preparedRoot, { recursive: true });
  if (await exists(target)) {
    throw new Error(
      `Prepared corpus already exists at ${target}; choose a new immutable snapshot identifier.`,
    );
  }
  const stage = await mkdtemp(join(preparedRoot, `.${name}-`));
  try {
    await prepare(stage);
    await rename(stage, target);
  } catch (error: unknown) {
    await rm(stage, { force: true, recursive: true });
    throw error;
  }
  return target;
}

export async function prepareEpub(
  command: PrepareEpubCommand,
): Promise<string> {
  const inputRoot = resolve(command.inputDirectory);
  const epubFiles = (await filesBelow(inputRoot)).filter((path) =>
    path.toLocaleLowerCase("en-US").endsWith(".epub"),
  );
  const calibreVersion = await output("ebook-convert", ["--version"]);
  return stageCorpus(
    command.cacheDirectory,
    `epub-${command.snapshot}`,
    async (stage) => {
      const rawDirectory = join(stage, ".calibre");
      await mkdir(rawDirectory);
      const texts: PreparedText[] = [];
      for (const [index, epubPath] of epubFiles.entries()) {
        const converted = join(rawDirectory, `${String(index).padStart(8, "0")}.txt`);
        await run("ebook-convert", [
          epubPath,
          converted,
          "--txt-output-formatting",
          "plain",
          "--txt-output-encoding",
          "utf-8",
          "--newline",
          "unix",
          "--max-line-length",
          "0",
        ]);
        texts.push({
          id: `epub:${portablePath(relative(inputRoot, epubPath))}`,
          text: normalizeReadingText(await readFile(converted, "utf8")),
        });
      }
      await rm(rawDirectory, { recursive: true });
      const documents = await writePreparedTexts(stage, texts);
      const manifest = createManifest({
        documents,
        source: {
          calibreVersion,
          kind: "epub",
          snapshot: command.snapshot,
        },
      });
      await writeFile(join(stage, "manifest.json"), stringifyManifest(manifest));
    },
  );
}

export async function prepareGutenberg(
  command: PrepareGutenbergCommand,
): Promise<string> {
  const harvestUrl = gutenbergHarvestUrl();
  const downloadRoot = resolve(
    command.cacheDirectory,
    "downloads",
    `gutenberg-${command.snapshot}`,
  );
  await mkdir(downloadRoot, { recursive: true });
  await run("wget", ["-w", "2", "-m", "-H", "-P", downloadRoot, harvestUrl]);
  const candidates = (await filesBelow(downloadRoot)).filter((path) =>
    /(?:\.txt|\.txt\.utf-8)$/iu.test(path),
  );
  const texts: PreparedText[] = [];
  for (const path of candidates) {
    const text = extractGutenbergBody(await readFile(path, "utf8"));
    if (text.length > 0) {
      texts.push({
        id: `gutenberg:${portablePath(relative(downloadRoot, path))}`,
        text,
      });
    }
  }
  return stageCorpus(
    command.cacheDirectory,
    `gutenberg-${command.snapshot}`,
    async (stage) => {
      const documents = await writePreparedTexts(stage, texts);
      const manifest = createManifest({
        documents,
        source: {
          harvestUrl,
          kind: "gutenberg",
          snapshot: command.snapshot,
        },
      });
      await writeFile(join(stage, "manifest.json"), stringifyManifest(manifest));
    },
  );
}

export async function prepareWikinews(
  command: PrepareWikinewsCommand,
): Promise<string> {
  const acquisition = wikinewsArchive(command.snapshot);
  const downloadRoot = resolve(
    command.cacheDirectory,
    "downloads",
    `wikinews-${command.snapshot}`,
  );
  await mkdir(downloadRoot, { recursive: true });
  const sumsPath = join(downloadRoot, basename(acquisition.sha1SumsUrl));
  const archivePath = join(downloadRoot, acquisition.archiveFile);
  if (!(await exists(sumsPath))) {
    await download(acquisition.sha1SumsUrl, sumsPath);
  }
  const archiveSha1 = parseSha1Sums(
    await readFile(sumsPath, "utf8"),
    acquisition.archiveFile,
  );
  if (!(await exists(archivePath))) {
    await download(acquisition.archiveUrl, archivePath);
  }
  const actualSha1 = createHash("sha1")
    .update(await readFile(archivePath))
    .digest("hex");
  if (actualSha1 !== archiveSha1) {
    throw new Error(
      `Wikinews archive SHA-1 mismatch: expected ${archiveSha1}, received ${actualSha1}.`,
    );
  }
  const xmlPath = join(downloadRoot, acquisition.archiveFile.replace(/\.bz2$/u, ""));
  if (!(await exists(xmlPath))) {
    await decompressBzip2(archivePath, xmlPath);
  }
  const pages = readWikinewsPages(await readFile(xmlPath, "utf8"));
  return stageCorpus(
    command.cacheDirectory,
    `wikinews-${command.snapshot}`,
    async (stage) => {
      const documents = await writePreparedTexts(stage, pages);
      const manifest = createManifest({
        documents,
        source: {
          archiveSha1,
          archiveUrl: acquisition.archiveUrl,
          kind: "wikinews",
          snapshot: command.snapshot,
        },
      });
      await writeFile(join(stage, "manifest.json"), stringifyManifest(manifest));
    },
  );
}
