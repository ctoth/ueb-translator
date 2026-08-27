import { describe, expect, it } from "vitest";

import { encodeCell } from "../dist/cell.js";
import { translateGrade1 } from "../dist/grade1.js";
import { translateUeb } from "../dist/index.js";
import {
  backtranslateGrade1,
  backtranslateGrade2,
} from "../dist/backtranslation.js";
import { translateGrade2 } from "../dist/grade2.js";
import { traceGrade2 } from "../dist/grade2-diagnostics.js";
import {
  translateTechnicalInput,
  type TechnicalInput,
} from "../dist/technical.js";

describe("published browser ESM", () => {
  it("loads and translates in a real browser realm", () => {
    expect(window.document).toBeDefined();
    expect(encodeCell([1, 2, 3, 4, 5, 6])).toBe("⠿");
    expect(translateGrade1("UEB 2024")).toEqual({
      braille: "⠠⠠⠥⠑⠃⠀⠼⠃⠚⠃⠙",
      mode: "grade1",
      ok: true,
    });
  });

  it("dispatches an explicit technical input from the combined entry point", () => {
    const input = {
      kind: "technical-text",
      text: "3+2=5",
    } satisfies TechnicalInput;
    expect(translateUeb({ input, mode: "technical" })).toEqual({
      braille: "⠼⠉⠐⠖⠼⠃⠐⠶⠼⠑",
      mode: "technical-text",
      ok: true,
    });
    expect(translateTechnicalInput(input)).toEqual(
      translateUeb({ input, mode: "technical" }),
    );
    expect(traceGrade2("and")).toMatchObject({ braille: "⠯", ok: true });
  });

  it("loads contracted UEB from its separate browser entry point", () => {
    expect(translateGrade2("You should receive your letter.")).toEqual({
      braille: "⠠⠽⠀⠩⠙⠀⠗⠉⠧⠀⠽⠗⠀⠇⠗⠲",
      mode: "grade2",
      ok: true,
    });
  });

  it("retains inverse ambiguity in the tree-shakeable browser entry point", () => {
    expect(backtranslateGrade1("⠼⠁⠃")).toEqual({
      candidate: { mode: "grade1", print: "12" },
      kind: "unique",
      mode: "grade1",
    });
    const result = backtranslateGrade2("⠨⠎");
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(Array.from(result.candidates, (candidate) => candidate.print)).toEqual([
        "ς",
        "σ",
      ]);
    }
  });
});
