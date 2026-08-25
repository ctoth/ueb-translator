import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");
const staleArtifact = resolve(
  repositoryRoot,
  "dist",
  "__stale-build-artifact__.js",
);

describe("published build isolation", () => {
  it("replaces dist instead of retaining files from an earlier build", async () => {
    await mkdir(resolve(repositoryRoot, "dist"), { recursive: true });
    await writeFile(staleArtifact, "export const stale = true;\n", "utf8");

    try {
      const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
      const build = spawnSync(npmCommand, ["run", "build"], {
        cwd: repositoryRoot,
        encoding: "utf8",
        shell: process.platform === "win32",
      });

      const output = `${build.stdout}${build.stderr}`;
      expect(build.error, output).toBeUndefined();
      expect(build.status, output).toBe(0);
      await expect(access(staleArtifact)).rejects.toThrow();
    } finally {
      await rm(staleArtifact, { force: true });
    }
  });
});
