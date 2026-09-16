import { describe, expect, it } from "vitest";

import { traceGrade2 } from "../src/grade2-diagnostics.js";
import { translateGrade2 } from "../src/grade2.js";

describe("contraction restrictions in inflected words", () => {
  // ICEB 2024 10.7.8: these letters are not pronounced like the word time.
  it.each([
    ["centimeters", "⠉⠢⠞⠊⠍⠑⠞⠻⠎"],
    ["Centimeters", "⠠⠉⠢⠞⠊⠍⠑⠞⠻⠎"],
    ["centimeter's", "⠉⠢⠞⠊⠍⠑⠞⠻⠄⠎"],
    ["centimeters'", "⠉⠢⠞⠊⠍⠑⠞⠻⠎⠄"],
  ])("translates %s without dot-5 t", (word, braille) => {
    expect(translateGrade2(word)).toEqual({ braille, mode: "grade2", ok: true });
  });

  it.each([
    // Both apostrophe spellings preserve the restriction; exact contextual
    // punctuation output is covered by contraction-context.test.ts.
    ["centimeter’s", "time"], ["centimeters’", "time"],
    ["altimeters", "time"], ["centimes", "time"],
    ["sentiments", "time"], ["sentimental", "time"],
    ["sentimentally", "time"], ["multimeter", "time"],
    ["multimeters", "time"], ["Mortimer's", "time"],
    ["enamels", "name"], ["enameled", "name"], ["enamelling", "name"],
    ["ornaments", "name"], ["ornamented", "name"],
    ["anemones", "one"], ["gasometers", "some"],
    ["somersaults", "some"], ["somersaulting", "some"],
    ["baronets", "one"], ["colonels", "one"],
    ["hereditary", "here"], ["villainesses", "ness"],
    ["villainess's", "ness"], ["microfilming", "of"],
    ["beaded", "be"], ["cones", "con"],
  ])("does not contract %s using %s", (word, contraction) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((rule) => rule.print)).not.toContain(contraction);
    }
  });

  it.each([
    ["times", "time"], ["timed", "time"], ["timely", "time"],
    ["sometimes", "time"], ["maritime", "time"],
    ["name's", "name"], ["named", "name"], ["names", "name"],
    ["someone", "some"], ["honey", "one"], ["monetary", "one"],
    ["hereafter", "here"], ["happiness", "ness"],
    ["conifer", "con"], ["become", "be"],
  ])("retains the permitted contraction in %s", (word, contraction) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((rule) => rule.print)).toContain(contraction);
    }
  });
});
