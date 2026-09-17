import { describe, expect, it } from "vitest";

import { translateGrade1 } from "../src/grade1.js";
import { translateGrade2 } from "../src/grade2.js";
import { traceGrade2 } from "../src/grade2-diagnostics.js";

describe("word exclusions in surrounding context", () => {
  it.each([
    "centimeter-long", "centimeters-long", "one-centimeter", "one-centimeter-long",
    "centimeter–long", "centimeter—long", "centimeter's-long",
    "'centimeter'", "'centimeters'", "‘centimeter’", "‘centimeters’",
    "'centimeter's'", "‘centimeter’s’", "'centimeter-long'",
  ])("preserves the time restriction in %s", (text) => {
    const result = traceGrade2(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rules.map((rule) => rule.print)).not.toContain("time");
  });

  it.each([
    ["'enamel'", "name"], ["'anemone'", "one"],
    ["'villainess'", "ness"], ["microfilm-based", "of"],
    ["hoity-toity", "ity"], ["centi-meter", "time"],
    ["gas-ometer", "some"],
    ["'hoity-toity'", "ity"], ["‘hoity-toity’", "ity"],
  ])("preserves exclusions for %s", (text, contraction) => {
    const result = traceGrade2(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rules.map((rule) => rule.print)).not.toContain(contraction);
  });

  it("does not transfer a restriction to other components or lose source offsets", () => {
    const result = traceGrade2("'centimeter-time'");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.filter((rule) => rule.print === "time")).toEqual([
        { id: "UEB-10.7-time", print: "time", start: 12, end: 16 },
      ]);
    }
  });

  it("preserves the complete corrected output", () => {
    expect(translateGrade2("centimeter-long")).toEqual({
      ok: true, mode: "grade2", braille: "⠉⠢⠞⠊⠍⠑⠞⠻⠤⠇⠰⠛",
    });
    expect(translateGrade2("‘centimeter’s’")).toEqual({
      ok: true, mode: "grade2", braille: "⠠⠦⠉⠢⠞⠊⠍⠑⠞⠻⠄⠎⠠⠴",
    });
  });
});

describe("curly apostrophe emission", () => {
  for (const translate of [translateGrade1, translateGrade2]) {
    it.each(["centimeter’s", "centimeters’", "don’t", "O’Connor", "D’ARCY", "’Tis"])(
      `${translate.name} emits apostrophes in %s`, (text) => {
        expect(translate(text)).toEqual(translate(text.replaceAll("’", "'")));
      },
    );
    it("preserves real directional single quotes, including words ending in s", () => {
      for (const text of ["‘cat’", "‘cats’", "‘don’t’"]) {
        const result = translate(text);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.braille.startsWith("⠠⠦")).toBe(true);
          expect(result.braille.endsWith("⠠⠴")).toBe(true);
        }
      }
    });
    it("uses a leading quote unless the word has a known initial elision", () => {
      expect(translate("’Word’")).toEqual(translate("‘Word’"));
      expect(translate("’Tis")).toEqual(translate("'Tis"));
      expect(translate("’n’")).toEqual(translate("'n'"));
    });
    it("recognizes a closing double quote before a comma", () => {
      const result = translate("else’s\", he observed.");
      expect(result.ok && result.braille).toContain("⠄⠎⠴⠂");
    });
    it("does not infer a closing quote from punctuation inside the next word", () => {
      const result = translate('that"...we');
      expect(result.ok && result.braille).toContain("⠠⠶⠲⠲⠲");
    });
    it("recognizes a closing quote before punctuation and an outer single quote", () => {
      const result = translate('thought"?\' And');
      expect(result.ok && result.braille).toContain("⠴⠦⠄");
    });
  }

  it("shares punctuation resolution with document and typeformed text paths", () => {
    expect(translateGrade1({ kind: "grade1-document", paragraphs: [{
      runs: [{ text: "don’t", typeforms: ["italic"] }],
    }] })).toEqual(translateGrade1({ kind: "grade1-document", paragraphs: [{
      runs: [{ text: "don't", typeforms: ["italic"] }],
    }] }));
    expect(translateGrade2({ kind: "grade2-document", runs: [{
      kind: "text", text: "centimeter’s", typeforms: ["italic"],
    }] })).toEqual(translateGrade2({ kind: "grade2-document", runs: [{
      kind: "text", text: "centimeter's", typeforms: ["italic"],
    }] }));
  });
});
