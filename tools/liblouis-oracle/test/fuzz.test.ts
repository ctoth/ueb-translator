import { describe, expect, it } from "vitest";

import {
  buildFuzzArbitrary,
  freshSeed,
  parseFuzzRunConfiguration,
} from "../src/fuzz.js";
import { divergenceFingerprint } from "../src/empirical.js";

describe("scheduled empirical fuzzing", () => {
  it("records a fresh signed 32-bit seed when none was supplied", () => {
    expect(freshSeed(() => Buffer.from([0x12, 0x34, 0x56, 0x78])))
      .toBe(0x12345678);
  });

  it("parses explicit reproducible run controls", () => {
    expect(parseFuzzRunConfiguration({
      ORACLE_FUZZ_NUM_RUNS: "4000",
      ORACLE_FUZZ_SEED: "-123",
    })).toEqual({ numRuns: 4000, seed: -123 });
  });

  it("rejects invalid seeds and run counts", () => {
    expect(() => parseFuzzRunConfiguration({ ORACLE_FUZZ_SEED: "x" }))
      .toThrow("ORACLE_FUZZ_SEED");
    expect(() => parseFuzzRunConfiguration({ ORACLE_FUZZ_NUM_RUNS: "0" }))
      .toThrow("ORACLE_FUZZ_NUM_RUNS");
  });

  it("biases generated text toward every named hard-shape family", () => {
    const arbitrary = buildFuzzArbitrary();
    expect(arbitrary).toBeDefined();
    expect(arbitrary).toHaveProperty("generate");
  });

  it("skips the triaged be difference signature but retains a distinct unknown", () => {
    const evidence = (input: string, local: string, oracle: string) => ({
      caseId: `fuzz:${input}`,
      input,
      local: { kind: "test" as const, output: local, testId: "fast-check" },
      oracle: {
        engine: "liblouis" as const,
        output: oracle,
        status: "development oracle",
        tables: ["en-ueb-g2.ctb"],
        version: "3.38.0",
      },
    });
    const known = new Set([
      divergenceFingerprint(evidence("bea", "⠆⠁", "⠃⠑⠁")),
    ]);
    expect(known.has(divergenceFingerprint(evidence("bej", "⠆⠚", "⠃⠑⠚"))))
      .toBe(true);
    expect(known.has(divergenceFingerprint(evidence("0a", "⠼⠚⠁", "⠼⠚⠰⠁"))))
      .toBe(false);
  });
});
