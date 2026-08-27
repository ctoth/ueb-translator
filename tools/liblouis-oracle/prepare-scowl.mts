import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";

import { SCOWL_SOURCE, parseScowlWordList } from "./src/empirical.js";

// The archive's own `./mk-list en_US 95` recipe produces this exact count.
// Its README's historical running-total table says 658,231, so do not use
// that prose summary as the executable data contract.
const EXPECTED_WORDS = 658_033;

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

function run(executable: string, arguments_: readonly string[]): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, arguments_, {
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${executable} exited with status ${String(code)}.`));
      }
    });
  });
}

async function main(): Promise<void> {
  const cache = resolve(process.argv[2] ?? ".corpus-cache");
  const downloadDirectory = join(cache, "downloads", "scowl");
  const archive = join(downloadDirectory, `scowl-${SCOWL_SOURCE.version}.tar.gz`);
  const root = join(cache, "scowl", `${SCOWL_SOURCE.version}-level-${String(SCOWL_SOURCE.level)}`);
  const wordlist = join(root, "words.txt");
  const manifestPath = join(root, "manifest.json");
  await mkdir(downloadDirectory, { recursive: true });
  if (!(await exists(archive))) {
    await download(SCOWL_SOURCE.archiveUrl, archive);
  }
  const archiveBytes = await readFile(archive);
  const digest = createHash("sha256").update(archiveBytes).digest("hex");
  if (digest !== SCOWL_SOURCE.archiveSha256) {
    throw new Error(
      `SCOWL archive SHA-256 mismatch: expected ${SCOWL_SOURCE.archiveSha256}, received ${digest}.`,
    );
  }
  if (await exists(wordlist)) {
    const words = parseScowlWordList(await readFile(wordlist, "utf8"));
    if (words.length !== EXPECTED_WORDS) {
      throw new Error(`Cached SCOWL word count is ${String(words.length)}, expected ${String(EXPECTED_WORDS)}.`);
    }
    console.log(wordlist);
    return;
  }
  const extracted = join(downloadDirectory, "extracted");
  await rm(extracted, { force: true, recursive: true });
  await mkdir(extracted, { recursive: true });
  await run("tar", ["-xzf", archive, "-C", extracted]);
  const sourceRoot = join(extracted, `scowl-${SCOWL_SOURCE.version}`);
  const finalDirectory = join(sourceRoot, "final");
  const selectedFiles = (await readdir(finalDirectory))
    .filter((file) => {
      const match = /^(?<category>american|english|special)-[^.]+\.(?<size>\d{2})/u.exec(file);
      const size = Number(match?.groups?.["size"] ?? Number.NaN);
      return Number.isFinite(size) && size <= SCOWL_SOURCE.level;
    })
    .sort();
  const sourceWords: string[] = [];
  for (const file of selectedFiles) {
    sourceWords.push(await readFile(join(finalDirectory, file), "latin1"));
  }
  const words = parseScowlWordList(sourceWords.join("\n"));
  if (words.length !== EXPECTED_WORDS) {
    throw new Error(
      `SCOWL ${SCOWL_SOURCE.version} level ${String(SCOWL_SOURCE.level)} produced ${String(words.length)} words; expected ${String(EXPECTED_WORDS)}.`,
    );
  }
  await mkdir(root, { recursive: true });
  await writeFile(wordlist, `${words.join("\n")}\n`, "utf8");
  for (const notice of ["Copyright", "README", "VERSION"] as const) {
    await copyFile(join(sourceRoot, notice), join(root, notice));
  }
  await writeFile(manifestPath, `${JSON.stringify({
    ...SCOWL_SOURCE,
    selectedFiles,
    wordCount: words.length,
  }, undefined, 2)}\n`);
  console.log(wordlist);
}

await main();
