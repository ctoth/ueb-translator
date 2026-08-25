import { describe, expect, it } from "vitest";

import { translateGrade1 } from "../dist/index.js";

describe("published browser ESM", () => {
  it("loads and translates in a real browser realm", () => {
    expect(window.document).toBeDefined();
    expect(translateGrade1("UEB 2024")).toEqual({
      braille: "⠠⠠⠥⠑⠃⠀⠼⠃⠚⠃⠙",
      mode: "grade1",
      ok: true,
    });
  });
});
