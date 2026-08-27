import { describe, expect, it, vi } from "vitest";

import {
  fileFuzzDivergence,
  type FuzzFailure,
} from "../src/fuzz-issue.js";

const failure: FuzzFailure = {
  counterexample: ["bea"],
  counterexamplePath: "0:0:0",
  evidence: {
    input: "bea",
    local: { output: "local" },
    oracle: { output: "oracle", version: "3.38.0" },
  },
  fingerprint: "adc0960559004b40df203591ae8d3c66bd9667efff4d95c21b3ee657ab2ef3e2",
  numShrinks: 2,
  ok: false,
  seed: 123,
};

describe("scheduled fuzz issue filing", () => {
  it("deduplicates across open and closed issues by stable fingerprint marker", () => {
    const run = vi.fn((arguments_: readonly string[]) => {
      void arguments_;
      return JSON.stringify([{ number: 54, url: "https://example.test/54" }]);
    });
    expect(fileFuzzDivergence(failure, "owner/repo", run))
      .toBe("https://example.test/54");
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toEqual([
      "issue", "list", "--repo", "owner/repo", "--state", "all",
      "--search", `"ueb-divergence:${failure.fingerprint}" in:body`,
      "--json", "number,url",
    ]);
  });

  it("creates one issue containing replay and exact evidence when no marker exists", () => {
    const run = vi.fn((arguments_: readonly string[]) =>
      arguments_[1] === "list" ? "[]" : "https://example.test/55\n"
    );
    expect(fileFuzzDivergence(failure, "owner/repo", run))
      .toBe("https://example.test/55");
    expect(run).toHaveBeenCalledTimes(2);
    const create = run.mock.calls[1]?.[0] ?? [];
    expect(create.slice(0, 4)).toEqual(["issue", "create", "--repo", "owner/repo"]);
    expect(create[create.indexOf("--body") + 1]).toContain(
      `<!-- ueb-divergence:${failure.fingerprint} -->`,
    );
    expect(create[create.indexOf("--body") + 1]).toContain("Replay path: `0:0:0`");
  });

  it("propagates issue creation failures so the workflow retains failure artifacts", () => {
    const run = vi.fn((arguments_: readonly string[]) => {
      if (arguments_[1] === "list") {
        return "[]";
      }
      throw new Error("GitHub issue filing failed");
    });
    expect(() => fileFuzzDivergence(failure, "owner/repo", run))
      .toThrow("GitHub issue filing failed");
  });
});
