import { describe, expect, it } from "vitest";

import { translateGrade1 } from "../dist/index.js";
import { translateGrade2 } from "../dist/grade2.js";

describe("published browser ESM", () => {
  it("loads and translates in a real browser realm", () => {
    expect(window.document).toBeDefined();
    expect(translateGrade1("UEB 2024")).toEqual({
      braille: "⠠⠠⠥⠑⠃⠀⠼⠃⠚⠃⠙",
      mode: "grade1",
      ok: true,
    });
  });

  it("loads contracted UEB from its separate browser entry point", () => {
    expect(translateGrade2("You should receive your letter.")).toEqual({
      braille: "⠠⠽⠀⠩⠙⠀⠗⠉⠧⠀⠽⠗⠀⠇⠗⠲",
      mode: "grade2",
      ok: true,
    });
  });
});
