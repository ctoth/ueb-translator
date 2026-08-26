import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

describe("published size report", () => {
  it("measures every stable entry point, the combined API, and the package", () => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const report = spawnSync(npmCommand, ["run", "--silent", "size"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      shell: process.platform === "win32",
      timeout: 60_000,
    });

    const output = `${report.stdout}${report.stderr}`;
    expect(report.error, output).toBeUndefined();
    expect(report.status, output).toBe(0);
    const parsed: unknown = JSON.parse(report.stdout);
    expect(isRecord(parsed)).toBe(true);
    if (!isRecord(parsed)) {
      return;
    }
    expect(Object.keys(parsed).sort()).toEqual([
      "backtranslation",
      "cells",
      "combined",
      "grade1",
      "grade2",
      "package",
      "technical",
      "unit",
    ]);
    expect(parsed["unit"]).toBe("bytes");
    expect(parsed["package"]).toMatchObject({
      files: expect.any(Number),
      packed: expect.any(Number),
      unpacked: expect.any(Number),
    });
  }, 65_000);
});
