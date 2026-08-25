import { describe, expect, it } from "vitest";

import { translateBasicGrade1 } from "../src/index.js";

describe("translateBasicGrade1", () => {
  it("translates lowercase Basic Latin letters", () => {
    expect(translateBasicGrade1("cat")).toEqual({
      braille: "⠉⠁⠞",
      ok: true,
    });
  });

  it("uses a capital symbol indicator for one capital", () => {
    expect(translateBasicGrade1("Q")).toEqual({
      braille: "⠠⠟",
      ok: true,
    });
  });

  it("uses a capitals word indicator for an uppercase letters-sequence", () => {
    expect(translateBasicGrade1("NASA")).toEqual({
      braille: "⠠⠠⠝⠁⠎⠁",
      ok: true,
    });
  });

  it("does not extend capitals word mode into lowercase letters", () => {
    expect(translateBasicGrade1("ABc")).toEqual({
      braille: "⠠⠁⠠⠃⠉",
      ok: true,
    });
  });

  it("starts numeric mode for each digit run", () => {
    expect(translateBasicGrade1("R2D2")).toEqual({
      braille: "⠠⠗⠼⠃⠠⠙⠼⠃",
      ok: true,
    });
  });

  it("maps zero to the numeric form of letter j", () => {
    expect(translateBasicGrade1("0")).toEqual({
      braille: "⠼⠚",
      ok: true,
    });
  });

  it("disambiguates a lowercase a-j immediately after a digit", () => {
    expect(translateBasicGrade1("7a 7k")).toEqual({
      braille: "⠼⠛⠰⠁⠀⠼⠛⠅",
      ok: true,
    });
  });

  it("uses braille blank for print space and preserves line boundaries", () => {
    expect(translateBasicGrade1("a b\nc\r\nd")).toEqual({
      braille: "⠁⠀⠃\n⠉\r\n⠙",
      ok: true,
    });
  });

  it("returns the exact UTF-16 and scalar offsets of unsupported input", () => {
    expect(translateBasicGrade1("a😀!")).toEqual({
      character: "😀",
      codeUnitIndex: 1,
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 1,
    });
  });

  it("reports one-code-unit unsupported characters", () => {
    expect(translateBasicGrade1("!")).toEqual({
      character: "!",
      codeUnitIndex: 0,
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 0,
    });
  });

  it("accepts empty input", () => {
    expect(translateBasicGrade1("")).toEqual({ braille: "", ok: true });
  });
});
