import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { APPENDIX1_LONGER_WORDS } from "../rules/ueb-2024/appendix1.js";
import { GRADE2_RULES } from "../rules/ueb-2024/grade2-rules.js";
import { SHORTFORMS } from "../rules/ueb-2024/shortforms.js";
import {
  backtranslateGrade1,
  backtranslateGrade2,
  selectBacktranslation,
} from "../src/backtranslation.js";
import {
  translateGrade1,
  type Grade1Document,
} from "../src/grade1.js";
import { translateGrade2 } from "../src/grade2.js";

function candidatePrints(
  result: ReturnType<typeof backtranslateGrade1>,
): readonly string[] {
  switch (result.kind) {
    case "unique":
      return [result.candidate.print];
    case "ambiguous":
      return Array.from(result.candidates, (candidate) => candidate.print);
    case "invalid":
      return [];
  }
}

function translatesGrade1To(print: string, braille: string): boolean {
  const translated = translateGrade1(print);
  return translated.ok && translated.braille === braille;
}

function grade2CandidatePrints(
  result: ReturnType<typeof backtranslateGrade2>,
): readonly string[] {
  switch (result.kind) {
    case "unique":
      return [result.candidate.print];
    case "ambiguous":
      return Array.from(result.candidates, (candidate) => candidate.print);
    case "invalid":
      return [];
  }
}

describe("backtranslateGrade1", () => {
  const supportedSamples = [
    "abcdefghijklmnopqrstuvwxyz",
    "A NASA AT&T CAUTION WET PAINT",
    "a̸a̵ăāa̧àâåãäáǎ",
    "αβγδεζηθικλμνξοπρσςτυφχψω ŊƏẞ ŋəß",
    "12,345.67 3b 4k 5-a 1+2",
    ",;:.!?…“”‘’\"'«»()[]{}⟨⟩/\\-–—_&@#$%+=×*÷−∷′″〃<>→↓←↑^~©®™°¶§¢€₣£₦¥•✓♮♭♯†‡♀♂",
    "a  b\r\nc\nd",
  ] as const;

  it.each(supportedSamples)(
    "round trips every supported symbol and plain-text mode in %j",
    (print) => {
      const translated = translateGrade1(print);
      expect(translated.ok).toBe(true);
      if (!translated.ok) {
        return;
      }
      const braille = translated.braille;
      const result = backtranslateGrade1(braille);
      expect(result.kind).not.toBe("invalid");
      expect(candidatePrints(result).some(
        (candidate) => translatesGrade1To(candidate, braille),
      )).toBe(true);
    },
  );

  it("retains distinct standards candidates with the same cells", () => {
    const translated = translateGrade1("σ");
    expect(translated.ok).toBe(true);
    if (!translated.ok) {
      return;
    }
    const result = backtranslateGrade1(translated.braille);
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(Array.from(result.candidates, (candidate) => candidate.print)).toEqual([
        "ς",
        "σ",
      ]);
    }
  });

  it("recovers text from explicit grouping, ligature, and typeform modes", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{
        runs: [
          { kind: "braille-group", runs: [{ text: "mass" }] },
          { text: " " },
          { kind: "ligature", letters: ["o", "e"] },
          { text: " " },
          { text: "three words here", typeforms: ["italic"] },
        ],
      }],
    } satisfies Grade1Document;
    const translated = translateGrade1(document);
    expect(translated.ok).toBe(true);
    if (!translated.ok) {
      return;
    }
    expect(candidatePrints(backtranslateGrade1(translated.braille))).toContain(
      "mass oe three words here",
    );
  });

  it("reports the first non-braille scalar exactly", () => {
    expect(backtranslateGrade1("⠁x")).toEqual({
      character: "x",
      codeUnitIndex: 1,
      kind: "invalid",
      mode: "grade1",
      reason: "invalid-braille-character",
      scalarIndex: 1,
    });
  });

  it.each(["⣿", "⠠", "⠠⠠⠠⠁", "⠰", "⠈⠡"])(
    "rejects an incomplete or unsupported Grade 1 sequence: %s",
    (braille) => {
      expect(backtranslateGrade1(braille).kind).toBe("invalid");
    },
  );

  it("decodes the empty input as the unique empty print string", () => {
    expect(backtranslateGrade1("")).toEqual({
      candidate: { mode: "grade1", print: "" },
      kind: "unique",
      mode: "grade1",
    });
  });

  it("retains cross-word Grade 1 ambiguity as a symbolic product", () => {
    const print = Array.from({ length: 15 }, () => "σ").join(" ");
    const translated = translateGrade1(print);
    expect(translated.ok).toBe(true);
    if (!translated.ok) {
      return;
    }
    const result = backtranslateGrade1(translated.braille);
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.candidates.size).toBe(32768n);
      expect(result.candidates.first.print).toBe(
        Array.from({ length: 15 }, () => "ς").join(" "),
      );
      expect(result.candidates.at(32767n)?.print).toBe(print);
    }
  });

  it("reports an invalid Grade 1 segment before whitespace", () => {
    expect(backtranslateGrade1("⣿⠀")).toEqual({
      codeUnitIndex: 0,
      kind: "invalid",
      mode: "grade1",
      reason: "no-standards-parse",
      scalarIndex: 0,
    });
  });

  it.each(["\n", "\r\n"])(
    "round trips a canonical capitals passage across %j",
    (boundary) => {
      const print = `AB CD${boundary}EF GH`;
      const translated = translateGrade1(print);
      expect(translated.ok).toBe(true);
      if (!translated.ok) {
        return;
      }
      expect(candidatePrints(backtranslateGrade1(translated.braille))).toContain(print);
    },
  );

  it("round trips generated supported plain text", () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom("a", "z", "A", "9", " ", "?", "é", "ω"), {
        maxLength: 12,
      }).map((parts) => parts.join("")),
      (print) => {
        const translated = translateGrade1(print);
        if (!translated.ok) {
          return false;
        }
        const braille = translated.braille;
        return candidatePrints(backtranslateGrade1(braille)).some(
          (candidate) => translatesGrade1To(candidate, braille),
        );
      },
    ));
  });
});

describe("backtranslateGrade2", () => {
  it("restores a word introduced by a single capital indicator", () => {
    const translated = translateGrade2("Braille");
    expect(translated.ok).toBe(true);
    if (translated.ok) {
      expect(grade2CandidatePrints(backtranslateGrade2(translated.braille)))
        .toContain("Braille");
    }
  });

  it("uses the derived Grade 1 pass to make a shortform canonical", () => {
    const translated = translateGrade2("about");
    expect(translated.ok).toBe(true);
    if (!translated.ok) {
      return;
    }
    const result = backtranslateGrade2(translated.braille);
    expect(result).toEqual({
      candidate: {
        mode: "grade2",
        print: "about",
        rules: ["UEB-10.9-about"],
      },
      kind: "unique",
      mode: "grade2",
    });
    expect(translateGrade2("ab")).toMatchObject({ braille: "⠰⠰⠁⠃" });
  });

  it("returns a unique result when UEB determines one print expansion", () => {
    const translated = translateGrade2("and");
    expect(translated.ok).toBe(true);
    if (!translated.ok) {
      return;
    }
    expect(backtranslateGrade2(translated.braille)).toEqual({
      candidate: {
        mode: "grade2",
        print: "and",
        rules: ["UEB-10.3-and"],
      },
      kind: "unique",
      mode: "grade2",
    });
  });

  it("keeps optional caller selection outside standards decoding", () => {
    const result = backtranslateGrade2("⠨⠎");
    const selected = selectBacktranslation(
      result,
      (candidates) => candidates.find((candidate) => candidate.print === "σ"),
    );
    expect(selected?.print).toBe("σ");
    expect(selectBacktranslation(result, () => ({
      mode: "grade2",
      print: "fabricated",
      rules: [],
    }))).toBeUndefined();
  });

  it("retains a multi-segment Cartesian product without eager expansion", () => {
    const result = backtranslateGrade2("⠨⠎⠀⠨⠎");
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.candidates.size).toBe(4n);
      expect(result.candidates.first.print).toBe("ς ς");
      expect(result.candidates.second.print).toBe("ς σ");
      expect(result.candidates.at(0n)).toBe(result.candidates.first);
      expect(result.candidates.at(2n)?.print).toBe("σ ς");
      expect(result.candidates.at(-1n)).toBeUndefined();
      expect(result.candidates.at(4n)).toBeUndefined();
      expect(result.candidates.find(() => false)).toBeUndefined();
    }
  });

  it("keeps a mixed foreign-language Cartesian product symbolic", () => {
    const ambiguous = Array.from({ length: 40 }, () => "⠨⠎").join("⠀");
    const frenchWord = "⠘⠷⠿⠉⠕⠇⠑⠘⠾";
    const result = backtranslateGrade2(`${ambiguous}⠀${frenchWord}`);

    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.candidates.size).toBe(1n << 40n);
      expect(result.candidates.first.print).toMatch(/ école$/u);
      expect(result.candidates.second.print).toMatch(/ école$/u);
      expect(result.candidates.at((1n << 40n) - 1n)?.print).toMatch(/ école$/u);
    }
  });

  it("offsets a nested mixed-UEB parse failure", () => {
    const frenchWord = "⠘⠷⠿⠉⠕⠇⠑⠘⠾";
    expect(backtranslateGrade2(`${frenchWord}⠁⣿`)).toEqual({
      codeUnitIndex: frenchWord.length + 1,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: frenchWord.length + 1,
    });
  });

  it("rejects undecodable foreign cells at their content offset", () => {
    expect(backtranslateGrade2("⠘⠷⣿⠘⠾")).toEqual({
      codeUnitIndex: 2,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: 2,
    });
  });

  it("orders adjacent non-UEB word and passage indicators", () => {
    const word = "⠘⠷⠿⠉⠕⠇⠑⠘⠾";
    const passage = "⠐⠷⠄⠊⠇⠀⠽⠠⠐⠾";
    expect(backtranslateGrade2(word + passage).kind).not.toBe("invalid");
    expect(backtranslateGrade2(passage + word).kind).not.toBe("invalid");
  });

  it("rejects unterminated and wrongly wrapped foreign segments", () => {
    expect(backtranslateGrade2("⠘⠷⠁")).toEqual({
      codeUnitIndex: 0,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: 0,
    });
    expect(backtranslateGrade2("⠘⠷⠁⠀⠃⠘⠾")).toEqual({
      codeUnitIndex: 2,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: 2,
    });
  });

  it("preserves every Grade 2 whitespace boundary exactly", () => {
    expect(backtranslateGrade2("⠀⠯\r\n⠯\r⠯\n⠯⠀")).toEqual({
      candidate: {
        mode: "grade2",
        print: " and\r\nand\rand\nand ",
        rules: [
          "UEB-10.3-and",
          "UEB-10.3-and",
          "UEB-10.3-and",
          "UEB-10.3-and",
        ],
      },
      kind: "unique",
      mode: "grade2",
    });
    expect(backtranslateGrade2("")).toEqual({
      candidate: { mode: "grade2", print: "", rules: [] },
      kind: "unique",
      mode: "grade2",
    });
  });

  it("reports a failed segment before a whitespace boundary", () => {
    expect(backtranslateGrade2("⣿⠀")).toEqual({
      codeUnitIndex: 0,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: 0,
    });
  });

  it("does not ask Liblouis, a dictionary, or a corpus to resolve ambiguity", () => {
    expect(backtranslateGrade2("⠨⠎").kind).toBe("ambiguous");
  });

  it("reports unsupported eight-dot cells as standards-invalid", () => {
    expect(backtranslateGrade2("⣿")).toEqual({
      codeUnitIndex: 0,
      kind: "invalid",
      mode: "grade2",
      reason: "no-standards-parse",
      scalarIndex: 0,
    });
  });

  it("does not treat stripped semantic markup as a Grade 2 candidate", () => {
    const result = backtranslateGrade2("⠣⠁⠜");
    expect(result.kind).not.toBe("invalid");
    if (result.kind === "unique") {
      expect(result.candidate.print).not.toBe("a");
    } else if (result.kind === "ambiguous") {
      expect(Array.from(result.candidates, (candidate) => candidate.print))
        .not.toContain("a");
    }
  });

  it.each(["⠠⠠⠠⠯⠠⠄", "⠈⠡⠯", "⠰⠯"])(
    "rejects a contraction in an impossible control state: %s",
    (braille) => {
      expect(backtranslateGrade2(braille).kind).toBe("invalid");
    },
  );

  it("reports a non-braille scalar in Grade 2 before parsing", () => {
    expect(backtranslateGrade2("x")).toEqual({
      character: "x",
      codeUnitIndex: 0,
      kind: "invalid",
      mode: "grade2",
      reason: "invalid-braille-character",
      scalarIndex: 0,
    });
  });

  it("handles selection for invalid and unique results without calling policy", () => {
    const policy = (): undefined => {
      throw new Error("policy must not be called");
    };
    expect(selectBacktranslation(backtranslateGrade2("⣿"), policy)).toBeUndefined();
    const and = translateGrade2("and");
    expect(and.ok).toBe(true);
    if (and.ok) {
      expect(selectBacktranslation(backtranslateGrade2(and.braille), policy)?.print)
        .toBe("and");
    }
  });

  it("round trips generated lowercase words and sentences", () => {
    const word = fc.string({
      maxLength: 10,
      minLength: 1,
      unit: fc.constantFrom(...Array.from("abcdefghijklmnopqrstuvwxyz")),
    });
    const printText = fc.array(word, { maxLength: 3, minLength: 1 })
      .map((words) => words.join(" "));
    fc.assert(fc.property(
      printText,
      (print) => {
        const translated = translateGrade2(print);
        if (!translated.ok) {
          return false;
        }
        const result = backtranslateGrade2(translated.braille);
        if (result.kind === "invalid") {
          return false;
        }
        const candidates = result.kind === "unique"
          ? [result.candidate]
          : result.candidates;
        let retainedOriginal = false;
        for (const candidate of candidates) {
          const retranslated = translateGrade2(candidate.print);
          if (!retranslated.ok || retranslated.braille !== translated.braille) {
            return false;
          }
          retainedOriginal ||= candidate.print === print;
        }
        return retainedOriginal;
      },
    ), { numRuns: 200 });
  });

  it("round trips every compiled Section 10 and Appendix 1 source", () => {
    const contextualPrint = GRADE2_RULES.map((rule): string => {
      switch (rule.kind) {
        case "alphabetic-wordsign":
        case "initial-letter-contraction":
        case "lower-wordsign":
        case "strong-wordsign":
          return rule.print;
        case "final-letter-groupsign":
          return `a${rule.print}`;
        case "lower-groupsign":
          return rule.print === "be" || rule.print === "con" || rule.print === "dis"
            ? `${rule.print}a`
            : `a${rule.print}a`;
        case "strong-contraction":
        case "strong-groupsign":
          return `a${rule.print}a`;
      }
    });
    const sourcePrints = new Set([
      ...contextualPrint,
      ...SHORTFORMS.map((rule) => rule.print),
      ...APPENDIX1_LONGER_WORDS.map((rule) => rule.print),
    ]);
    for (const print of sourcePrints) {
      const translated = translateGrade2(print);
      expect(translated.ok, print).toBe(true);
      if (!translated.ok) {
        continue;
      }
      expect(
        grade2CandidatePrints(backtranslateGrade2(translated.braille)),
        print,
      ).toContain(print);
    }
  });
});
