import { describe, expect, it, vi } from "vitest";

import {
  classifyFuzzResult,
  describeFuzzResult,
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
  it("deduplicates against an open issue by stable fingerprint marker", () => {
    const run = vi.fn((arguments_: readonly string[]) => {
      void arguments_;
      return JSON.stringify([{ number: 54, state: "OPEN", url: "https://example.test/54" }]);
    });
    expect(fileFuzzDivergence(failure, "owner/repo", run))
      .toBe("https://example.test/54");
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toEqual([
      "issue", "list", "--repo", "owner/repo", "--state", "all",
      "--search", `"ueb-divergence:${failure.fingerprint}" in:body`,
      "--json", "number,state,url",
    ]);
  });

  it("reopens a closed issue when its divergence recurs instead of hiding the regression", () => {
    const run = vi.fn((arguments_: readonly string[]) =>
      arguments_[1] === "list"
        ? JSON.stringify([{ number: 54, state: "CLOSED", url: "https://example.test/54" }])
        : ""
    );
    expect(fileFuzzDivergence(failure, "owner/repo", run))
      .toBe("https://example.test/54");
    expect(run).toHaveBeenCalledTimes(2);
    const reopen = run.mock.calls[1]?.[0] ?? [];
    expect(reopen.slice(0, 5)).toEqual(["issue", "reopen", "54", "--repo", "owner/repo"]);
    const comment = reopen[reopen.indexOf("--comment") + 1] ?? "";
    expect(comment).toContain("Seed: `123`");
    expect(comment).toContain("Replay path: `0:0:0`");
  });

  it("prefers an open duplicate over reopening a closed one", () => {
    const run = vi.fn((arguments_: readonly string[]) => {
      void arguments_;
      return JSON.stringify([
        { number: 54, state: "CLOSED", url: "https://example.test/54" },
        { number: 60, state: "OPEN", url: "https://example.test/60" },
      ]);
    });
    expect(fileFuzzDivergence(failure, "owner/repo", run))
      .toBe("https://example.test/60");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("rejects an issue list entry without a known state", () => {
    const run = vi.fn((arguments_: readonly string[]) => {
      void arguments_;
      return JSON.stringify([{ number: 54, url: "https://example.test/54" }]);
    });
    expect(() => fileFuzzDivergence(failure, "owner/repo", run))
      .toThrow("GitHub issue list entry must include a number, state, and URL.");
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

  it("classifies passing, divergent, and infrastructure-error results", () => {
    expect(classifyFuzzResult({ numRuns: 10, numShrinks: 0, ok: true, seed: 7 }))
      .toEqual({ kind: "passed", numRuns: 10, seed: 7 });
    expect(classifyFuzzResult(failure)).toEqual({ failure, kind: "divergence" });
    expect(classifyFuzzResult({ error: "oracle exited", ok: false }))
      .toEqual({ kind: "error", message: "oracle exited" });
    expect(() => classifyFuzzResult({ ok: false })).toThrow("Unrecognized fuzz result.");
    expect(() => classifyFuzzResult({ ok: true })).toThrow("Unrecognized fuzz result.");
  });

  it("describes every result in the workflow log without requiring the artifact", () => {
    expect(describeFuzzResult({ kind: "passed", numRuns: 10, seed: 7 }))
      .toBe("No unledgered divergence in 10 cases (seed 7).");
    expect(describeFuzzResult({ kind: "error", message: "oracle exited" }))
      .toBe("Fuzz infrastructure error: oracle exited");
    expect(describeFuzzResult({ failure, kind: "divergence" }).split("\n")).toEqual([
      "Unledgered divergence:",
      `- Fingerprint: \`${failure.fingerprint}\``,
      "- Seed: `123`",
      "- Replay path: `0:0:0`",
      "- Shrinks: `2`",
      "- Minimal print input: `\"bea\"`",
      "- Local output: `local`",
      "- Liblouis 3.38.0: `oracle`",
    ]);
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
