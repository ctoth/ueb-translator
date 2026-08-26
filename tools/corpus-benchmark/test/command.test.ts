import { describe, expect, it } from "vitest";

import { parseCommand } from "../src/command.js";

describe("parseCommand", () => {
  it("constructs each preparation variant without stringly typed option bags", () => {
    expect(
      parseCommand([
        "prepare",
        "epub",
        "--input",
        "private-books",
        "--snapshot",
        "private-2026-08-26",
      ]),
    ).toEqual({
      cacheDirectory: ".corpus-cache",
      inputDirectory: "private-books",
      kind: "prepare-epub",
      snapshot: "private-2026-08-26",
    });
    expect(
      parseCommand(["prepare", "gutenberg", "--snapshot", "20260826"]),
    ).toEqual({
      cacheDirectory: ".corpus-cache",
      kind: "prepare-gutenberg",
      snapshot: "20260826",
    });
    expect(
      parseCommand(["prepare", "wikinews", "--snapshot", "20260801"]),
    ).toEqual({
      cacheDirectory: ".corpus-cache",
      kind: "prepare-wikinews",
      snapshot: "20260801",
    });
  });

  it("constructs a benchmark command with an explicit sealed partition", () => {
    expect(
      parseCommand([
        "benchmark",
        "--corpus",
        ".corpus-cache/prepared/wikinews-20260801",
        "--partition",
        "held-out",
      ]),
    ).toEqual({
      corpusDirectory: ".corpus-cache/prepared/wikinews-20260801",
      kind: "benchmark",
      partition: "held-out",
    });
    expect(
      parseCommand([
        "benchmark",
        "--corpus",
        "cache",
        "--partition",
        "training",
      ]),
    ).toMatchObject({ partition: "training" });
  });

  it("accepts an explicit private cache root", () => {
    expect(
      parseCommand([
        "prepare",
        "gutenberg",
        "--snapshot",
        "20260826",
        "--cache",
        "elsewhere",
      ]),
    ).toMatchObject({ cacheDirectory: "elsewhere" });
  });

  it.each([
    [["prepare", "wikinews", "--snapshot", "latest"], "dated snapshot"],
    [["prepare", "wikinews", "--snapshot", "2026-08-01"], "dated snapshot"],
    [["prepare", "gutenberg"], "--snapshot"],
    [["prepare", "epub", "--snapshot", "private"], "--input"],
    [["benchmark", "--corpus", "cache", "--partition", "test"], "partition"],
    [[], "prepare or benchmark"],
    [["unknown"], "prepare or benchmark"],
    [["prepare", "unknown"], "Unknown corpus source"],
    [["prepare"], "Unknown corpus source"],
    [["prepare", "epub", "--input", "", "--snapshot", "x"], "--input"],
    [["prepare", "epub", "--input"], "requires a value"],
    [["prepare", "epub", "--input", "--snapshot"], "requires a value"],
    [["prepare", "epub", "--what", "x"], "Unknown corpus option"],
    [
      ["prepare", "epub", "--input", "x", "--input", "y", "--snapshot", "z"],
      "more than once",
    ],
    [["benchmark", "--cache", "x"], "does not apply"],
    [
      ["prepare", "epub", "--input", "x", "--snapshot", "z", "--corpus", "x"],
      "does not apply",
    ],
    [
      ["prepare", "gutenberg", "--snapshot", "20260826", "--input", "x"],
      "does not apply",
    ],
    [
      ["prepare", "wikinews", "--snapshot", "20260826", "--input", "x"],
      "does not apply",
    ],
  ])("rejects invalid arguments %j", (arguments_, message) => {
    expect(() => parseCommand(arguments_)).toThrow(message);
  });
});
