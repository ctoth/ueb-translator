import { describe, expect, it } from "vitest";

import { encodeOracleInput } from "../src/runner.js";

describe("Liblouis stdin serialization", () => {
  it.each([
    ["\\", "\\\\"],
    ["\\9", "\\\\9"],
    ["\\'", "\\\\'"],
    ["before \\times after", "before \\\\times after"],
  ])("escapes literal backslashes without changing neighbors", (input, expected) => {
    expect(encodeOracleInput(input)).toBe(expected);
  });
});
