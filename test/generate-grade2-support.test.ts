import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTEXTUAL_COMPACT_INTEGER_MAX } from "../src/contextual-schema.ts";
import {
  encodeCompactIntegers,
  readGeneratedFile,
} from "../scripts/generate-grade2-support.mts";

describe("Grade 2 generator support", () => {
  it("keeps compact integers below UTF-16 surrogate space", () => {
    const encoded = encodeCompactIntegers(
      [CONTEXTUAL_COMPACT_INTEGER_MAX],
      "test values",
    );
    expect(encoded.charCodeAt(0)).toBe(0xd7ff);
    expect(() =>
      encodeCompactIntegers([CONTEXTUAL_COMPACT_INTEGER_MAX + 1], "test values")
    ).toThrow("Compiled Grade 2 test values exceeds fixed-width encoding.");
  });

  it("reports how to restore a missing generated file", async () => {
    const missing = resolve(import.meta.dirname, "missing-grade2-program.ts");
    await expect(readGeneratedFile(missing)).rejects.toThrow(
      `${missing} is missing; run npm run grade2:generate.`,
    );
  });
});
