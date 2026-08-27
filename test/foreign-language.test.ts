import { describe, expect, it } from "vitest";

import { backtranslateGrade2 } from "../src/backtranslation.js";
import {
  translateGrade2,
  type Grade2Document,
} from "../src/grade2.js";

function candidatePrints(
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

describe("ICEB 2024 Section 13 foreign-language passages", () => {
  it("implements 13.5.1 with UEB modifiers and no code-switch indicators", () => {
    const document = {
      kind: "grade2-document",
      runs: [{
        code: "ueb",
        kind: "foreign",
        language: "fr",
        text: "grandes écoles",
      }],
    } satisfies Grade2Document;

    expect(translateGrade2(document)).toEqual({
      braille: "⠛⠗⠁⠝⠙⠑⠎⠀⠘⠌⠑⠉⠕⠇⠑⠎",
      mode: "grade2",
      ok: true,
    });
  });

  it("transcribes the cited 13.5.1 German leisure-reading example", () => {
    const document = {
      kind: "grade2-document",
      runs: [{
        code: "ueb",
        kind: "foreign",
        language: "de",
        text: "Ein Geschenk für uns",
      }],
    } satisfies Grade2Document;

    expect(translateGrade2(document)).toEqual({
      braille: "⠠⠑⠊⠝⠀⠠⠛⠑⠎⠉⠓⠑⠝⠅⠀⠋⠘⠒⠥⠗⠀⠥⠝⠎",
      mode: "grade2",
      ok: true,
    });
  });

  it("implements 13.6.4 for the cited French textbook phrase", () => {
    const document = {
      kind: "grade2-document",
      runs: [{
        code: "foreign",
        kind: "foreign",
        language: "fr",
        text: "Il y a deux crèches en ville",
      }],
    } satisfies Grade2Document;

    expect(translateGrade2(document)).toEqual({
      braille: "⠐⠷⠄⠨⠊⠇⠀⠽⠀⠁⠀⠙⠑⠥⠭⠀⠉⠗⠮⠉⠓⠑⠎⠀⠑⠝⠀⠧⠊⠇⠇⠑⠠⠐⠾",
      mode: "grade2",
      ok: true,
    });
  });

  it("implements 13.7.1 and Section 14 non-UEB word indicators", () => {
    const document = {
      kind: "grade2-document",
      runs: [{
        code: "foreign",
        kind: "foreign",
        language: "fr",
        text: "école",
      }],
    } satisfies Grade2Document;

    expect(translateGrade2(document)).toEqual({
      braille: "⠘⠷⠿⠉⠕⠇⠑⠘⠾",
      mode: "grade2",
      ok: true,
    });
  });

  it.each([
    ["fr", "je préfère", "⠘⠌"],
    ["de", "für uns", "⠘⠒"],
  ] as const)(
    "round-trips a %s phrase inside an English sentence",
    (language, phrase, uebModifier) => {
      const print = `I said ${phrase} today.`;
      const document = {
        kind: "grade2-document",
        runs: [
          { kind: "text", text: "I said " },
          { code: "foreign", kind: "foreign", language, text: phrase },
          { kind: "text", text: " today." },
        ],
      } satisfies Grade2Document;
      const translated = translateGrade2(document);

      expect(translated.ok).toBe(true);
      if (!translated.ok) return;
      expect(translated.braille).not.toContain(uebModifier);
      expect(candidatePrints(backtranslateGrade2(translated.braille))).toContain(print);
    },
  );
});
