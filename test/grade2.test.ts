import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { APPENDIX1_LONGER_WORDS } from "../rules/ueb-2024/appendix1.js";
import {
  FINAL_GROUPSIGN_EXCEPTIONS,
  INITIAL_CONTRACTION_EXCEPTIONS,
} from "../rules/ueb-2024/constraints.js";
import { GRADE2_RULES } from "../rules/ueb-2024/grade2-rules.js";
import { SHORTFORMS } from "../rules/ueb-2024/shortforms.js";
import { translateGrade1 } from "../src/grade1.js";
import { traceGrade2 } from "../src/grade2-diagnostics.js";
import { translateGrade2, type Grade2Document } from "../src/grade2.js";

describe("official Grade 2 source inventory", () => {
  it("cites every Section 10 contraction", () => {
    expect(GRADE2_RULES).toHaveLength(107);
    expect(
      Object.fromEntries(
        [
          "alphabetic-wordsign",
          "final-letter-groupsign",
          "initial-letter-contraction",
          "lower-groupsign",
          "lower-wordsign",
          "strong-contraction",
          "strong-groupsign",
          "strong-wordsign",
        ].map((kind) => [
          kind,
          GRADE2_RULES.filter((rule) => rule.kind === kind).length,
        ]),
      ),
    ).toEqual({
      "alphabetic-wordsign": 23,
      "final-letter-groupsign": 12,
      "initial-letter-contraction": 33,
      "lower-groupsign": 10,
      "lower-wordsign": 6,
      "strong-contraction": 5,
      "strong-groupsign": 12,
      "strong-wordsign": 6,
    });
    for (const rule of GRADE2_RULES) {
      expect(rule.citation.authority).toBe("ICEB");
      expect(rule.citation.locator).toMatch(/^10\./u);
      expect(rule.id).toMatch(/^UEB-10\./u);
    }
  });

  it("represents Appendix 1's 75 base shortforms independently", () => {
    expect(SHORTFORMS).toHaveLength(75);
    expect(new Set(SHORTFORMS.map((rule) => rule.print)).size).toBe(75);
    for (const rule of SHORTFORMS) {
      expect(rule.citation.locator).toBe("10.9 and Appendix 1");
      expect(rule.id).toMatch(/^UEB-10\.9-/u);
    }
  });

  it("represents every explicit Appendix 1 longer-word use independently", () => {
    expect(APPENDIX1_LONGER_WORDS).toHaveLength(327);
    expect(new Set(APPENDIX1_LONGER_WORDS.map((rule) => rule.id)).size).toBe(327);
    for (const rule of APPENDIX1_LONGER_WORDS) {
      expect(rule.citation.locator).toBe("10.9 and Appendix 1");
      expect(rule.id).toMatch(/^UEB-Appendix-1-/u);
    }
  });

  it("cites every enumerated initial and final contraction exception", () => {
    expect(INITIAL_CONTRACTION_EXCEPTIONS).toHaveLength(13);
    expect(FINAL_GROUPSIGN_EXCEPTIONS).toHaveLength(2);
    for (const constraint of [
      ...INITIAL_CONTRACTION_EXCEPTIONS,
      ...FINAL_GROUPSIGN_EXCEPTIONS,
    ]) {
      expect(constraint.citation.authority).toBe("ICEB");
      expect(constraint.citation.locator).toMatch(/^10\.(?:7|8)\./u);
    }
  });
});

describe("translateGrade2", () => {
  it.each(GRADE2_RULES)(
    "applies $id in a standards-permitted context",
    (rule) => {
      const context = (() => {
        if (
          rule.kind === "alphabetic-wordsign" ||
          rule.kind === "lower-wordsign" ||
          rule.kind === "strong-wordsign" ||
          rule.kind === "initial-letter-contraction"
        ) {
          return rule.print;
        }
        if (rule.kind === "final-letter-groupsign") {
          return `a${rule.print}`;
        }
        if (
          rule.kind === "lower-groupsign" &&
          ["be", "con", "dis"].includes(rule.print)
        ) {
          return `${rule.print}a`;
        }
        return `a${rule.print}a`;
      })();

      const result = traceGrade2(context);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rules.map((applied) => applied.id)).toContain(rule.id);
      }
    },
  );

  it.each(SHORTFORMS)("applies $id as a standing-alone word", (rule) => {
    const result = traceGrade2(rule.print);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.id)).toContain(rule.id);
    }
  });

  it.each(APPENDIX1_LONGER_WORDS)("applies $id from Appendix 1", (rule) => {
    const result = traceGrade2(rule.print);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.id)).toContain(rule.id);
    }
  });

  it.each(
    INITIAL_CONTRACTION_EXCEPTIONS.flatMap((constraint) =>
      constraint.words.map((word) => ({
        contraction: constraint.contraction,
        id: constraint.id,
        word,
      }))
    ),
  )("applies $id to $word", ({ contraction, word }) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.id)).not.toContain(
        `UEB-10.7-${contraction}`,
      );
    }
  });

  it.each(
    FINAL_GROUPSIGN_EXCEPTIONS.flatMap((constraint) =>
      constraint.words.map((word) => ({
        groupsign: constraint.groupsign,
        id: constraint.id,
        word,
      }))
    ),
  )("applies $id to $word", ({ groupsign, word }) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.print)).not.toContain(groupsign);
    }
  });

  it.each(
    FINAL_GROUPSIGN_EXCEPTIONS.flatMap((constraint) =>
      constraint.endings.map((ending) => ({
        ending,
        groupsign: constraint.groupsign,
        id: constraint.id,
        word: `a${ending}`,
      }))
    ),
  )("applies $id to words ending in $ending", ({ groupsign, word }) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.print)).not.toContain(groupsign);
    }
  });

  it.each([
    ["oneness", "ness"],
    ["happiness", "ness"],
  ] as const)("does not use %s in %s under UEB 10.8.4", (word, groupsign) => {
    const result = traceGrade2(word);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((applied) => applied.print)).not.toContain(groupsign);
    }
  });

  it("uses alphabetic wordsigns and preserves separators", () => {
    expect(translateGrade2("but can do every\nfrom")).toEqual({
      braille: "⠃⠀⠉⠀⠙⠀⠑\n⠋",
      mode: "grade2",
      ok: true,
    });
  });

  it.each([
    ["b", "⠰⠃"],
    ["ab", "⠰⠰⠁⠃"],
    ["a al", "⠁⠀⠰⠰⠁⠇"],
    ["st", "⠎⠞"],
    ["3d", "⠼⠉⠰⠙"],
    ["page 10a", "⠏⠁⠛⠑⠀⠼⠁⠚⠰⠁"],
  ] as const)("protects the ambiguous Grade 1 sequence %s", (text, braille) => {
    expect(translateGrade2(text)).toEqual({ braille, mode: "grade2", ok: true });
  });

  it.each([
    ["AB", "⠰⠠⠠⠁⠃"],
    ["Ab", "⠰⠠⠁⠃"],
    ["AATech", "⠠⠠⠁⠁⠞⠠⠄⠑⠡"],
  ] as const)("orders and preserves composed modes in %s", (text, braille) => {
    expect(translateGrade2(text)).toEqual({ braille, mode: "grade2", ok: true });
  });

  it("rejects a contraction that crosses a capitals terminator", () => {
    expect(translateGrade2("ABEd")).toEqual({
      braille: "⠠⠠⠁⠃⠑⠠⠄⠙",
      mode: "grade2",
      ok: true,
    });
    const result = traceGrade2("ABEd");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.map((rule) => rule.print)).not.toContain("ed");
    }
  });

  it("uses full lexical coordinates for contractions after an apostrophe", () => {
    expect(translateGrade2("D'Arcy")).toEqual({
      braille: "⠠⠙⠄⠠⠜⠉⠽",
      mode: "grade2",
      ok: true,
    });
  });

  it("rejects a contraction with a mode prefix strictly inside it", () => {
    const contracted = traceGrade2("aND");
    expect(contracted.ok).toBe(true);
    if (contracted.ok) {
      expect(contracted.rules.map((rule) => rule.print)).not.toContain("and");
    }
  });

  it("uses a capital word indicator for an internal uppercase run", () => {
    expect(translateGrade2("PowerPC")).toEqual({
      braille: "⠠⠏⠪⠻⠠⠠⠏⠉",
      mode: "grade2",
      ok: true,
    });
  });

  it("contracts ASCII ranges without guarding a non-ASCII word", () => {
    const contracted = traceGrade2("caféhouse");
    expect(contracted.ok).toBe(true);
    if (contracted.ok) {
      expect(contracted.rules.map((rule) => rule.print)).toContain("ou");
    }
    expect(translateGrade2("Asunción")).toEqual({
      braille: "⠠⠁⠎⠥⠝⠉⠊⠘⠌⠕⠝",
      mode: "grade2",
      ok: true,
    });
  });

  it("does not treat a trailing ASCII segment as the whole non-ASCII word", () => {
    const grade1 = translateGrade1("madroñas");
    const grade2 = translateGrade2("madroñas");
    expect(grade1.ok).toBe(true);
    expect(grade2.ok).toBe(true);
    if (grade1.ok && grade2.ok) expect(grade2.braille).toBe(grade1.braille);
  });

  it.each(["alt's", "cd's", "hm's", "yr's"])(
    "retains ambiguity protection for the possessive %s",
    (text) => {
      const result = translateGrade2(text);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.braille.startsWith("⠰⠰")).toBe(true);
    },
  );

  it("resolves capitals around contractions with the shared mode program", () => {
    expect(translateGrade2("THE CAT SAT ON")).toEqual({
      braille: "⠠⠠⠠⠮⠀⠉⠁⠞⠀⠎⠁⠞⠀⠕⠝⠠⠄",
      mode: "grade2",
      ok: true,
    });
    expect(translateGrade2("PowerPoint caféhouse")).toEqual({
      braille: "⠠⠏⠪⠻⠠⠏⠕⠔⠞⠀⠉⠁⠋⠘⠌⠑⠓⠳⠎⠑",
      mode: "grade2",
      ok: true,
    });
    expect(translateGrade2("aND")).toEqual({
      braille: "⠁⠠⠠⠝⠙",
      mode: "grade2",
      ok: true,
    });
  });

  it("keeps separator context in the composed pass", () => {
    expect(translateGrade2("was?")).toEqual({
      braille: "⠺⠁⠎⠦",
      mode: "grade2",
      ok: true,
    });
    expect(translateGrade2("?-190")).toEqual({
      braille: "⠰⠦⠤⠼⠁⠊⠚",
      mode: "grade2",
      ok: true,
    });
  });

  it("applies the UEB 2.6 standing-alone punctuation rules", () => {
    expect(translateGrade2("(can) out-and-out")).toEqual({
      braille: "⠐⠣⠉⠐⠜⠀⠳⠤⠯⠤⠳",
      mode: "grade2",
      ok: true,
    });
  });

  it("treats a CRLF unit as a standing boundary", () => {
    expect(translateGrade2("can\r\nbut")).toEqual({
      braille: "⠉\r\n⠃",
      mode: "grade2",
      ok: true,
    });
  });

  it("does not treat letters adjoining a slash as standing alone", () => {
    expect(translateGrade2("this/that could/should")).toEqual({
      braille: "⠹⠊⠎⠸⠌⠹⠁⠞⠀⠉⠳⠇⠙⠸⠌⠩⠳⠇⠙",
      mode: "grade2",
      ok: true,
    });
  });

  it("applies the lower-sign punctuation restrictions in UEB 10.5", () => {
    expect(translateGrade2("“Be safe.” Take enough. Come in,")).toEqual({
      braille: "⠦⠠⠃⠑⠀⠎⠁⠋⠑⠲⠴⠀⠠⠞⠁⠅⠑⠀⠢⠳⠣⠲⠀⠠⠉⠕⠍⠑⠀⠊⠝⠂",
      mode: "grade2",
      ok: true,
    });
    expect(translateGrade2("be-be")).toEqual({
      braille: "⠃⠑⠤⠃⠑",
      mode: "grade2",
      ok: true,
    });
  });

  it("applies derived Grade 1 guards to each joined component", () => {
    expect(translateGrade2("ab-cd")).toEqual({
      braille: "⠰⠰⠁⠃⠤⠰⠰⠉⠙",
      mode: "grade2",
      ok: true,
    });
  });

  it.each(
    APPENDIX1_LONGER_WORDS.filter((rule) => rule.print.includes("n't")),
  )("does not guard the apostrophe suffix in $print", (rule) => {
    const result = translateGrade2(rule.print);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.braille).not.toContain("⠰");
    }
  });

  it("translates the official shortform sentence from UEB 10.9.1", () => {
    expect(
      translateGrade2(
        "You should receive your letter tomorrow afternoon.",
      ),
    ).toEqual({
      braille: "⠠⠽⠀⠩⠙⠀⠗⠉⠧⠀⠽⠗⠀⠇⠗⠀⠞⠍⠀⠁⠋⠝⠲",
      mode: "grade2",
      ok: true,
    });
  });

  it("uses strong contractions wherever permitted by UEB 10.3", () => {
    expect(translateGrade2("andante bathed coffee")).toEqual({
      braille: "⠯⠁⠝⠞⠑⠀⠃⠁⠮⠙⠀⠉⠷⠋⠑⠑",
      mode: "grade2",
      ok: true,
    });
  });

  it("does not use ing at the beginning of a word under UEB 10.4.3", () => {
    expect(translateGrade2("finger ingot")).toEqual({
      braille: "⠋⠬⠻⠀⠔⠛⠕⠞",
      mode: "grade2",
      ok: true,
    });
  });

  it("uses shortest-cell precedence and the UEB tie order", () => {
    expect(translateGrade2("thence named afford")).toEqual({
      braille: "⠹⠰⠑⠀⠐⠝⠙⠀⠁⠋⠿⠙",
      mode: "grade2",
      ok: true,
    });
  });

  it("does not bridge an explicitly marked compound boundary", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [
        {
          boundaries: [{ at: 5, kind: "compound" }],
          kind: "word",
          standing: "alone",
          text: "sweetheart",
        },
      ],
    };

    expect(translateGrade2(document)).toEqual({
      braille: "⠎⠺⠑⠑⠞⠓⠑⠜⠞",
      mode: "grade2",
      ok: true,
    });
  });

  it.each([
    ["syllable", 1, "⠃⠑⠉⠕⠍⠑"],
    ["syllable", 2, "⠆⠉⠕⠍⠑"],
  ] as const)(
    "obeys a %s boundary at position %i for a first-syllable groupsign",
    (kind, at, braille) => {
      const document: Grade2Document = {
        kind: "grade2-document",
        runs: [{
          boundaries: [{ at, kind }],
          kind: "word",
          standing: "alone",
          text: "become",
        }],
      };
      expect(translateGrade2(document)).toEqual({
        braille,
        mode: "grade2",
        ok: true,
      });
    },
  );

  it.each([
    ["head", 2, "prefix"],
    ["action", 4, "syllable"],
    ["sweetheart", 5, "braille-line"],
  ] as const)(
    "does not cross an explicit %s boundary in %s",
    (text, at, kind) => {
      const document: Grade2Document = {
        kind: "grade2-document",
        runs: [{
          boundaries: [{ at, kind }],
          kind: "word",
          standing: "alone",
          text,
        }],
      };
      const result = traceGrade2(document);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rules).not.toContainEqual(
          expect.objectContaining({ start: at - 1 }),
        );
      }
    },
  );

  it("rejects an out-of-range structured boundary", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [
        {
          boundaries: [{ at: 99, kind: "syllable" }],
          kind: "word",
          standing: "alone",
          text: "become",
        },
      ],
    };

    expect(translateGrade2(document)).toEqual({
      at: 99,
      mode: "grade2",
      ok: false,
      reason: "invalid-boundary",
      runIndex: 0,
    });
  });

  it("rejects a boundary at the start of a structured word", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [{
        boundaries: [{ at: 0, kind: "syllable" }],
        kind: "word",
        standing: "alone",
        text: "become",
      }],
    };
    expect(translateGrade2(document)).toEqual({
      at: 0,
      mode: "grade2",
      ok: false,
      reason: "invalid-boundary",
      runIndex: 0,
    });
  });

  it.each(["a😀", "😀a", "ȧ", "a\tb"])(
    "reports unsupported input without partial output: %s",
    (text) => {
      const result = traceGrade2(text);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("unsupported-character");
      }
    },
  );

  it("propagates unsupported input from a document text run", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [
        { kind: "text", text: "ok " },
        { kind: "text", text: "😀" },
      ],
    };
    expect(translateGrade2(document).ok).toBe(false);
  });

  it("combines structured word and text runs with global rule offsets", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [
        { kind: "word", standing: "alone", text: "can" },
        { kind: "text", text: " and" },
      ],
    };
    expect(traceGrade2(document)).toEqual({
      braille: "⠉⠀⠯",
      mode: "grade2",
      ok: true,
      rules: [
        { end: 3, id: "UEB-10.1-can", print: "can", start: 0 },
        { end: 7, id: "UEB-10.3-and", print: "and", start: 4 },
      ],
    });
  });

  it("applies shared typeform modes around contracted text", () => {
    const document: Grade2Document = {
      kind: "grade2-document",
      runs: [{ kind: "text", text: "and", typeforms: ["italic"] }],
    };
    expect(translateGrade2(document)).toEqual({
      braille: "⠨⠂⠯",
      mode: "grade2",
      ok: true,
    });
  });

  it("keeps structured standing and boundary options in typeformed callbacks", () => {
    expect(translateGrade2({
      kind: "grade2-document",
      runs: [{
        kind: "word",
        standing: "joined",
        text: "can",
        typeforms: ["italic"],
      }],
    })).toEqual({
      braille: "⠨⠂⠉⠁⠝",
      mode: "grade2",
      ok: true,
    });
    expect(translateGrade2({
      kind: "grade2-document",
      runs: [{
        boundaries: [{ at: 1, kind: "syllable" }],
        kind: "word",
        standing: "alone",
        text: "become",
        typeforms: ["italic"],
      }],
    })).toEqual({
      braille: "⠨⠂⠃⠑⠉⠕⠍⠑",
      mode: "grade2",
      ok: true,
    });
  });

  it.each(["'twould", "AB", "aBc"])(
    "handles capitalization and apostrophe structure through the generic path: %s",
    (text) => {
      expect(translateGrade2(text).ok).toBe(true);
    },
  );

  it("keeps rule diagnostics out of the ordinary result", () => {
    expect(translateGrade2("and")).toEqual({
      braille: "⠯",
      mode: "grade2",
      ok: true,
    });
    expect(traceGrade2("and")).toEqual({
      braille: "⠯",
      mode: "grade2",
      ok: true,
      rules: [
        {
          end: 3,
          id: "UEB-10.3-and",
          print: "and",
          start: 0,
        },
      ],
    });
  });

  it("emits only Unicode Braille cells and line boundaries", () => {
    fc.assert(
      fc.property(
        fc.string({
          unit: fc.constantFrom(...Array.from("abcdefghijklmnopqrstuvwxyz .")),
        }),
        (text) => {
          const translated = translateGrade2(text);
          expect(translated.ok).toBe(true);
          if (translated.ok) {
            expect(translated.braille).toMatch(/^[\u2800-\u28ff\r\n]*$/u);
          }
        },
      ),
      { numRuns: 500 },
    );
  });

  it("agrees with Grade 1 when generated text has no contraction opportunities", () => {
    const uncontractableWord = fc.string({
      maxLength: 12,
      minLength: 1,
      unit: fc.constantFrom("a", "i", "o"),
    });
    const uncontractableText = fc.array(uncontractableWord, {
      maxLength: 4,
      minLength: 1,
    }).map((words) => words.join(" "));

    fc.assert(fc.property(uncontractableText, (text) => {
      const grade1 = translateGrade1(text);
      const grade2 = translateGrade2(text);
      expect(grade1.ok).toBe(true);
      expect(grade2.ok).toBe(true);
      if (grade1.ok && grade2.ok) {
        expect(grade2.braille).toBe(grade1.braille);
      }
    }), { numRuns: 500 });
  });
});
