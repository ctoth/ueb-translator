import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { cleanOutputDirectory } from "../scripts/clean-output-lib.mts";

describe("cleanOutputDirectory", () => {
  it("removes a complete generated output tree", async () => {
    const root = await mkdtemp(join(tmpdir(), "ueb-translator-clean-output-"));
    try {
      const output = resolve(root, "generated", "nested");
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "stale.mjs"), "stale\n", "utf8");

      await cleanOutputDirectory(pathToFileURL(resolve(root, "generated")));

      await expect(access(resolve(root, "generated"))).rejects.toThrow();
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
