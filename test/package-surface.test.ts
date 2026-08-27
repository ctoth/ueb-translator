import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

describe("packed browser package", () => {
  it("passes the clean-fixture export, declaration, and browser contract", () => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const verification = spawnSync(npmCommand, ["run", "package:verify"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      shell: process.platform === "win32",
      timeout: 120_000,
    });

    const output = `${verification.stdout}${verification.stderr}`;
    expect(verification.error, output).toBeUndefined();
    expect(verification.status, output).toBe(0);
    expect(output).toContain('"browser":"chromium"');
    expect(output).toContain('"attw":{"cjsResolvesToEsm":0,"legacyNodeNoResolution":0}');
    expect(output).toContain('"grade1Isolated":true');
  }, 125_000);
});
