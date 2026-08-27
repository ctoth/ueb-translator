import { spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const staleArtifact = resolve(repositoryRoot, "dist", "__stale-build-artifact__.js");

await mkdir(resolve(repositoryRoot, "dist"), { recursive: true });
await writeFile(staleArtifact, "export const stale = true;\n", "utf8");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npmCommand, ["run", "build"], {
  cwd: repositoryRoot,
  encoding: "utf8",
  shell: process.platform === "win32",
});
const output = `${build.stdout}${build.stderr}`;
if (build.error !== undefined) {
  throw new Error(`Build could not start: ${build.error.message}\n${output}`);
}
if (build.status !== 0) {
  throw new Error(`Build exited ${String(build.status)}.\n${output}`);
}

try {
  await access(staleArtifact);
  throw new Error("The build retained an artifact from the previous dist tree.");
} catch (error: unknown) {
  if (
    error instanceof Error &&
    error.message === "The build retained an artifact from the previous dist tree."
  ) {
    throw error;
  }
}

await Promise.all([
  access(resolve(repositoryRoot, "dist", "index.d.ts")),
  access(resolve(repositoryRoot, "dist", "index.js")),
]);
console.log(JSON.stringify({ build: "verified", staleArtifactRemoved: true }));
