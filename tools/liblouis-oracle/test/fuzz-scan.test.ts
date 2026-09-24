import { describe, expect, it } from "vitest";
import { scanFuzzCases } from "../src/fuzz-scan.js";
import { ExplorationTracker } from "../src/exploration.js";

describe("full-length fuzz scanning", () => {
  it("continues beyond disagreements and reports progress through the requested count", async () => {
    const tracker = new ExplorationTracker(() => false, () => { /* Count only. */ });
    let progress = 0;
    await scanFuzzCases({ numRuns: 10_001, seed: 19 }, tracker,
      (id) => Promise.resolve({ id, ok: true, output: "different",
        oracle: {engine: "liblouis", status: "test", tables: ["en-ueb-g2.ctb"], version: "3.38.0"} }),
      () => { progress += 1; });
    expect(tracker.summary()).toMatchObject({ cases: 10_001, untriaged: 10_001, ok: false });
    expect(progress).toBe(1);
  });

  it("stops on infrastructure errors without reporting a complete scan or shrinking them", async () => {
    const tracker = new ExplorationTracker(() => false, () => { /* No evidence expected. */ });
    let calls = 0;
    await expect(scanFuzzCases({ numRuns: 100, seed: 19 }, tracker, () => {
      calls += 1;
      return Promise.reject(new Error("Oracle unavailable"));
    }, () => { throw new Error("No progress expected"); })).rejects.toThrow("Fuzz scan interrupted");
    expect(calls).toBe(1);
    expect(tracker.summary().cases).toBe(0);
  });
});
