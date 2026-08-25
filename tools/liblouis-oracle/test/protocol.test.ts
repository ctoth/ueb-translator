import { describe, expect, it } from "vitest";

import type { OracleMode } from "../src/protocol.js";
import {
  parseOracleRequest,
  parseOracleRequestLine,
  tablesForMode,
} from "../src/protocol.js";

describe("Liblouis oracle protocol", () => {
  it("accepts a complete request without changing it", () => {
    expect(
      parseOracleRequestLine(
        '{"id":"case-1","direction":"forward","mode":"grade2","text":"news"}',
      ),
    ).toEqual({
      ok: true,
      request: {
        direction: "forward",
        id: "case-1",
        mode: "grade2",
        text: "news",
      },
    });
  });

  it("rejects malformed JSON, missing fields, and unknown fields", () => {
    expect(parseOracleRequestLine("{")).toEqual({
      error: "request must be valid JSON",
      ok: false,
    });
    expect(
      parseOracleRequestLine(
        '{"id":"case-1","direction":"forward","mode":"grade2"}',
      ),
    ).toEqual({ error: "text must be a string", ok: false });
    expect(
      parseOracleRequestLine(
        '{"id":"case-1","direction":"forward","mode":"grade2","text":"news","typo":true}',
      ),
    ).toEqual({ error: "unknown request field: typo", ok: false });
  });

  it("rejects every malformed field at the protocol boundary", () => {
    for (const value of [null, "request", []]) {
      expect(parseOracleRequest(value)).toEqual({
        error: "request must be a JSON object",
        ok: false,
      });
    }

    expect(
      parseOracleRequest({ direction: "forward", id: 1, mode: "grade1", text: "x" }),
    ).toEqual({ error: "id must be a non-empty string", ok: false });
    expect(
      parseOracleRequest({ direction: "forward", id: "", mode: "grade1", text: "x" }),
    ).toEqual({ error: "id must be a non-empty string", ok: false });
    expect(
      parseOracleRequest({ direction: "sideways", id: "x", mode: "grade1", text: "x" }),
    ).toEqual({ error: "direction must be backward or forward", ok: false });
    expect(
      parseOracleRequest({ direction: "forward", id: "x", mode: "grade3", text: "x" }),
    ).toEqual({
      error: "mode must be grade1, grade2, or technical",
      ok: false,
    });
    expect(
      parseOracleRequest({ direction: "forward", id: "x", mode: "grade1", text: 1 }),
    ).toEqual({ error: "text must be a string", ok: false });
    expect(
      parseOracleRequest({ direction: "forward", id: "x", mode: "grade1", text: "a\u0000b" }),
    ).toEqual({ error: "text must not contain U+0000", ok: false });
  });

  it("accepts backward requests and every supported mode", () => {
    const modes: readonly OracleMode[] = ["grade1", "technical"];
    for (const mode of modes) {
      expect(
        parseOracleRequest({ direction: "backward", id: mode, mode, text: "x" }),
      ).toEqual({
        ok: true,
        request: { direction: "backward", id: mode, mode, text: "x" },
      });
    }
  });

  it("maps modes only to the pinned release's named UEB tables", () => {
    expect(tablesForMode("grade1")).toEqual(["en-ueb-g1.ctb"]);
    expect(tablesForMode("grade2")).toEqual(["en-ueb-g2.ctb"]);
    expect(tablesForMode("technical")).toEqual([
      "en-ueb-g2.ctb",
      "en-ueb-math.ctb",
    ]);
  });
});
