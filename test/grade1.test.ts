import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  translateGrade1,
  type Grade1Document,
} from "../src/grade1.js";
import { parseCompositionText } from "../src/grade1-runtime.js";

it("exposes the shared composition parser", () => {
  expect(parseCompositionText("a").ok).toBe(true);
});

describe("ICEB 2024 4.1 and 8.3-8.6: letters and capitals", () => {
  it("translates the complete English alphabet in uncontracted mode", () => {
    expect(translateGrade1("abcdefghijklmnopqrstuvwxyz")).toEqual({
      braille: "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵",
      mode: "grade1",
      ok: true,
    });
  });

  it("uses symbol, word, and passage capital indicators", () => {
    expect(translateGrade1("A NASA AT&T")).toEqual({
      braille: "⠠⠠⠠⠁⠀⠝⠁⠎⠁⠀⠁⠞⠈⠯⠞⠠⠄",
      mode: "grade1",
      ok: true,
    });
    expect(translateGrade1("CAUTION WET PAINT")).toEqual({
      braille: "⠠⠠⠠⠉⠁⠥⠞⠊⠕⠝⠀⠺⠑⠞⠀⠏⠁⠊⠝⠞⠠⠄",
      mode: "grade1",
      ok: true,
    });
  });

  it("terminates capitals word mode at nonletters but not at modifiers", () => {
    expect(translateGrade1("ANGLO-SAXON ABc ÉTÉ")).toEqual({
      braille:
        "⠠⠠⠁⠝⠛⠇⠕⠤⠠⠠⠎⠁⠭⠕⠝⠀⠠⠁⠠⠃⠉⠀⠠⠠⠘⠌⠑⠞⠘⠌⠑",
      mode: "grade1",
      ok: true,
    });
  });

  it("does not begin capitals word mode inside a mixed-case word", () => {
    expect(translateGrade1("MariaDBC CosmosDB")).toEqual({
      braille: "⠠⠍⠁⠗⠊⠁⠠⠙⠠⠃⠠⠉⠀⠠⠉⠕⠎⠍⠕⠎⠠⠙⠠⠃",
      mode: "grade1",
      ok: true,
    });
    expect(translateGrade1("cDNA")).toEqual({
      braille: "⠉⠠⠙⠠⠝⠠⠁",
      mode: "grade1",
      ok: true,
    });
  });

  it("continues capitals passages across line boundaries", () => {
    expect(translateGrade1("AB CD\nEF GH IJ KL")).toEqual({
      braille: "⠠⠠⠠⠁⠃⠀⠉⠙\n⠑⠋⠀⠛⠓⠀⠊⠚⠀⠅⠇⠠⠄",
      mode: "grade1",
      ok: true,
    });
  });

  it("places a capitals passage indicator before a leading symbol", () => {
    expect(translateGrade1("(A B C")).toEqual({
      braille: "⠠⠠⠠⠐⠣⠁⠀⠃⠀⠉⠠⠄",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 4.2: Latin modifiers", () => {
  it("places modifiers before their letters and capitals before modifiers", () => {
    expect(translateGrade1("café Élise")).toEqual({
      braille: "⠉⠁⠋⠘⠌⠑⠀⠠⠘⠌⠑⠇⠊⠎⠑",
      mode: "grade1",
      ok: true,
    });
  });

  it("supports every listed Latin combining modifier on decomposed input", () => {
    expect(
      translateGrade1(
        "a̸a̵ăāa̧àâåãäáǎ",
      ),
    ).toEqual({
      braille:
        "⠈⠡⠁⠈⠒⠁⠈⠬⠁⠈⠤⠁⠘⠯⠁⠘⠡⠁⠘⠩⠁⠘⠫⠁⠘⠻⠁⠘⠒⠁⠘⠌⠁⠘⠬⠁",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 4.4-4.6: Greek and special letters", () => {
  it("translates every Greek letter and final sigma", () => {
    expect(translateGrade1("αβγδεζηθικλμνξοπρσςτυφχψω")).toEqual({
      braille:
        "⠨⠁⠨⠃⠨⠛⠨⠙⠨⠑⠨⠵⠨⠒⠨⠹⠨⠊⠨⠅⠨⠇⠨⠍⠨⠝⠨⠭⠨⠕⠨⠏⠨⠗⠨⠎⠨⠎⠨⠞⠨⠥⠨⠋⠨⠯⠨⠽⠨⠺",
      mode: "grade1",
      ok: true,
    });
  });

  it("capitalises Greek, eng, schwa, and German sharp s", () => {
    expect(translateGrade1("Ω ŊƏẞ")).toEqual({
      braille: "⠠⠨⠺⠀⠠⠠⠘⠝⠸⠢⠨⠮",
      mode: "grade1",
      ok: true,
    });
    expect(translateGrade1("ŋəß")).toEqual({
      braille: "⠘⠝⠸⠢⠨⠮",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 4.3: explicit ligatures", () => {
  it("places the ligature indicator between explicitly joined letters", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { kind: "ligature", letters: ["o", "e"] },
            { text: " " },
            { kind: "ligature", letters: ["A", "E"] },
            { text: " " },
            { kind: "ligature", letters: ["A", "e"] },
            { text: " " },
            { kind: "ligature", letters: ["a", "E"] },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille:
        "⠕⠘⠖⠑⠀⠠⠠⠁⠘⠖⠑⠀⠠⠁⠘⠖⠑⠀⠁⠠⠘⠖⠑",
      mode: "grade1",
      ok: true,
    });
  });

  it.each(["ab", "1", "😀"])("rejects a nonletter ligature item: %s", (value) => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [{ kind: "ligature", letters: ["a", value] }],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      letterIndex: 1,
      mode: "grade1",
      ok: false,
      reason: "invalid-ligature-letter",
      value,
    });
  });

  it("rejects a sparse ligature letters array", () => {
    const letters = new Array<string>(2);
    letters[0] = "a";
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ kind: "ligature", letters }] }],
    };

    // @ts-expect-error Exercise malformed JavaScript input at the typed boundary.
    expect(translateGrade1(document)).toEqual({
      mode: "grade1",
      ok: false,
      reason: "invalid-run",
      runIndex: 0,
    });
  });
});

describe("ICEB 2024 6.1-6.5: numeric mode", () => {
  it("enters numeric mode once and retains it through decimal punctuation", () => {
    expect(translateGrade1("12,345.67")).toEqual({
      braille: "⠼⠁⠃⠂⠉⠙⠑⠲⠋⠛",
      mode: "grade1",
      ok: true,
    });
  });

  it("uses grade 1 for a-j after a numeric-mode symbol and restarts after space", () => {
    expect(translateGrade1("3b 4k 5-a")).toEqual({
      braille: "⠼⠉⠰⠃⠀⠼⠙⠅⠀⠼⠑⠤⠁",
      mode: "grade1",
      ok: true,
    });
  });

  it("maps zero through the numeric form of j", () => {
    expect(translateGrade1("0")).toEqual({
      braille: "⠼⠚",
      mode: "grade1",
      ok: true,
    });
  });

  it("continues numeric mode through numeric punctuation and terminates at other symbols", () => {
    expect(translateGrade1("1.2,3 1a 1A 1-2 1–2 1—2 1+2")).toEqual({
      braille:
        "⠼⠁⠲⠃⠂⠉⠀⠼⠁⠰⠁⠀⠼⠁⠠⠁⠀⠼⠁⠤⠼⠃⠀⠼⠁⠠⠤⠼⠃⠀⠼⠁⠐⠠⠤⠼⠃⠀⠼⠁⠐⠖⠼⠃",
      mode: "grade1",
      ok: true,
    });
  });

  it("emits one numeric indicator for a run terminated by a letter", () => {
    expect(translateGrade1("12a 12,3a")).toEqual({
      braille: "⠼⠁⠃⠰⠁⠀⠼⠁⠃⠂⠉⠰⠁",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 3 and 7: general symbols and punctuation", () => {
  it("translates the unambiguous general-symbol inventory", () => {
    expect(translateGrade1("&@#$%+×÷−<>→↓←↑^~©®™°¶§¢€£¥•✓♮♭♯")).toEqual({
      braille:
        "⠈⠯⠈⠁⠸⠹⠈⠎⠨⠴⠐⠖⠐⠦⠐⠌⠐⠤⠈⠣⠈⠜⠳⠕⠳⠩⠳⠪⠳⠬⠈⠢⠈⠔⠘⠉⠘⠗⠘⠞⠘⠚⠘⠏⠘⠎⠈⠉⠈⠑⠈⠇⠈⠽⠸⠲⠈⠩⠼⠡⠼⠣⠼⠩",
      mode: "grade1",
      ok: true,
    });
  });

  it("translates primes, proportion, ditto, gender, and nondirectional quotes", () => {
    expect(translateGrade1("∷ ′ ″ 〃 ♀♂ \"x\" «x»")).toEqual({
      braille:
        "⠒⠒⠀⠶⠀⠶⠶⠀⠐⠂⠀⠘⠭⠘⠽⠀⠠⠶⠭⠠⠶⠀⠸⠦⠭⠸⠴",
      mode: "grade1",
      ok: true,
    });
  });

  it("translates the vertical bar from the compiled U+007C symbol rule", () => {
    expect(translateGrade1("|")).toEqual({
      braille: "⠸⠳",
      mode: "grade1",
      ok: true,
    });
  });

  it("disambiguates a question mark only where it could be a wordsign or opening quote", () => {
    expect(translateGrade1("?")).toEqual({
      braille: "⠰⠦",
      mode: "grade1",
      ok: true,
    });
    expect(translateGrade1("What? ?-190")).toEqual({
      braille: "⠠⠺⠓⠁⠞⠦⠀⠰⠦⠤⠼⠁⠊⠚",
      mode: "grade1",
      ok: true,
    });
    expect(translateGrade1("a\n? –? —?")).toEqual({
      braille: "⠁\n⠰⠦⠀⠠⠤⠰⠦⠀⠐⠠⠤⠰⠦",
      mode: "grade1",
      ok: true,
    });
  });

  it("follows directional punctuation and bracket symbols", () => {
    expect(translateGrade1("“Hi!” ‘(yes)’ […] / \\ _ — – - …")).toEqual({
      braille:
        "⠦⠠⠓⠊⠖⠴⠀⠠⠦⠐⠣⠽⠑⠎⠐⠜⠠⠴⠀⠨⠣⠲⠲⠲⠨⠜⠀⠸⠌⠀⠸⠡⠀⠨⠤⠀⠐⠠⠤⠀⠠⠤⠀⠤⠀⠲⠲⠲",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 3.23: explicit whitespace contract", () => {
  it("preserves ASCII spaces and line boundaries exactly", () => {
    expect(translateGrade1("a  b\r\nc\nd")).toEqual({
      braille: "⠁⠀⠀⠃\r\n⠉\n⠙",
      mode: "grade1",
      ok: true,
    });
  });

  it("preserves CRLF after a non-ASCII scalar", () => {
    expect(translateGrade1("é\r\nω")).toEqual({
      braille: "⠘⠌⠑\r\n⠨⠺",
      mode: "grade1",
      ok: true,
    });
  });
});

describe("ICEB 2024 3.4: explicit braille grouping", () => {
  it("accepts text runs with the shared document-model discriminator", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ kind: "text", text: "hi" }, { text: "!" }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille: "⠓⠊⠖",
      mode: "grade1",
      ok: true,
    });
  });

  it("rejects a sparse typeforms array", () => {
    const typeforms = new Array<"italic">(1);
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: "a", typeforms }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      mode: "grade1",
      ok: false,
      reason: "invalid-run",
      runIndex: 0,
    });
  });

  it("rejects a non-array typeforms value", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: "a", typeforms: "italic" }] }],
    };

    // @ts-expect-error Exercise malformed JavaScript input at the typed boundary.
    expect(translateGrade1(document)).toEqual({
      mode: "grade1",
      ok: false,
      reason: "invalid-run",
      runIndex: 0,
    });
  });

  it.each([
    { kind: "text" },
    { kind: "ligature" },
    { kind: "braille-group" },
    { kind: "unknown" },
    { text: 1 },
    null,
  ])("returns a typed error for a malformed run: %j", (run) => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [run] }],
    };

    // @ts-expect-error Exercise malformed JavaScript input at the typed boundary.
    expect(translateGrade1(document)).toEqual({
      mode: "grade1",
      ok: false,
      reason: "invalid-run",
      runIndex: 0,
    });
  });

  it("groups only when the typed input requests semantic braille grouping", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { text: "mass" },
            {
              kind: "braille-group",
              runs: [{ text: "sun" }],
            },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille: "⠍⠁⠎⠎⠣⠎⠥⠝⠜",
      mode: "grade1",
      ok: true,
    });
  });

  it("propagates failures from nested grouped content", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            {
              kind: "braille-group",
              runs: [{ text: "😀" }],
            },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document).ok).toBe(false);
  });
});

describe("ICEB 2024 9.2-9.4: explicit typeform semantics", () => {
  it("uses symbol, word, and passage indicators from typed runs", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { text: "x", typeforms: ["italic"] },
            { text: " " },
            { text: "bold", typeforms: ["bold"] },
            { text: " " },
            { text: "one two three", typeforms: ["underline"] },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille:
        "⠨⠆⠭⠀⠘⠂⠃⠕⠇⠙⠀⠸⠶⠕⠝⠑⠀⠞⠺⠕⠀⠞⠓⠗⠑⠑⠸⠄",
      mode: "grade1",
      ok: true,
    });
  });

  it("repeats nested word indicators for exactly two symbols-sequences", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { text: " one two", typeforms: ["italic", "bold"] },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille:
        "⠀⠨⠂⠘⠂⠕⠝⠑⠀⠨⠂⠘⠂⠞⠺⠕",
      mode: "grade1",
      ok: true,
    });
  });

  it("uses symbol indicators for each one-character sequence", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: "a b", typeforms: ["italic"] }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille: "⠨⠆⠁⠀⠨⠆⠃",
      mode: "grade1",
      ok: true,
    });
  });

  it("nests passage terminators in reverse order and preserves paragraphs", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { text: "one two three", typeforms: ["italic", "script"] },
          ],
        },
        { runs: [{ text: "x", typeforms: [] }, { text: "", typeforms: ["bold"] }] },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille:
        "⠨⠶⠈⠶⠕⠝⠑⠀⠞⠺⠕⠀⠞⠓⠗⠑⠑⠈⠄⠨⠄\n\n⠭",
      mode: "grade1",
      ok: true,
    });
  });

  it("preserves whitespace-only typeformed runs without indicators", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: " \n", typeforms: ["script"] }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille: "⠀\n",
      mode: "grade1",
      ok: true,
    });
  });

  it("does not count trailing whitespace as a typeformed symbol", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: "x ", typeforms: ["italic"] }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille: "⠨⠆⠭⠀",
      mode: "grade1",
      ok: true,
    });
  });

  it("supports the official transcriber-defined typeform indicators", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [
        {
          runs: [
            { text: "x", typeforms: ["transcriber-defined"] },
            { text: " " },
            { text: "one two three", typeforms: ["transcriber-defined"] },
          ],
        },
      ],
    } satisfies Grade1Document;

    expect(translateGrade1(document)).toEqual({
      braille:
        "⠈⠼⠆⠭⠀⠈⠼⠶⠕⠝⠑⠀⠞⠺⠕⠀⠞⠓⠗⠑⠑⠈⠼⠄",
      mode: "grade1",
      ok: true,
    });
  });

  it.each([
    "😀",
    "😀 ok",
    "ok 😀",
    "one two 😀",
  ])("propagates unsupported input from a typeformed run: %s", (text) => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text, typeforms: ["italic"] }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document).ok).toBe(false);
  });

  it("propagates unsupported input from an untypeformed document run", () => {
    const document = {
      kind: "grade1-document",
      paragraphs: [{ runs: [{ text: "😀" }] }],
    } satisfies Grade1Document;

    expect(translateGrade1(document).ok).toBe(false);
  });
});

describe("unsupported input", () => {
  it("reports the first unsupported scalar without partial output", () => {
    expect(translateGrade1("a😀")).toEqual({
      character: "😀",
      codeUnitIndex: 1,
      mode: "grade1",
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 1,
    });
  });

  it("reports an unsupported combining sequence as one source grapheme", () => {
    expect(translateGrade1("ȧ")).toEqual({
      character: "ȧ",
      codeUnitIndex: 0,
      mode: "grade1",
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 0,
    });
  });

  it("rejects whitespace outside the explicit space and line-boundary contract", () => {
    expect(translateGrade1("a\tb")).toEqual({
      character: "\t",
      codeUnitIndex: 1,
      mode: "grade1",
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 1,
    });
  });
});

describe("property-based invariants", () => {
  const supportedScalars = [
    ...Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),
    " ", "\n", "\r", ",", ";", ":", ".", "!", "?", "…", "“", "”",
    "‘", "’", "'", "(", ")", "[", "]", "{", "}", "⟨", "⟩", "/", "\\",
    "-", "–", "—", "_", "&", "@", "#", "$", "%", "+", "=", "×", "*",
    "÷", "−", "<", ">", "→", "↓", "←", "↑", "^", "~", "©", "®", "™",
    "°", "¶", "§", "¢", "€", "₣", "£", "₦", "¥", "•", "✓", "♮", "♭",
    "♯", "†", "‡", "♀", "♂", "∷", "′", "″", "〃", "\"", "«", "»", "é", "É",
    "α", "Ω", "ŋ", "Ŋ", "ə", "Ə", "ß", "ẞ",
  ];
  const supportedText = fc
    .array(fc.constantFrom(...supportedScalars), { maxLength: 80 })
    .map((values) => values.join(""));

  it("is deterministic and emits only braille cells or preserved line boundaries", () => {
    fc.assert(
      fc.property(supportedText, (text) => {
        const first = translateGrade1(text);
        const second = translateGrade1(text);
        expect(first).toEqual(second);
        expect(first.ok).toBe(true);
        if (first.ok) {
          expect(first.braille).toMatch(/^[\u2800-\u28ff\r\n]*$/u);
        }
      }),
    );
  });

  it("reports exact UTF-16 and scalar offsets after any supported prefix", () => {
    fc.assert(
      fc.property(supportedText, (prefix) => {
        const result = translateGrade1(`${prefix}😀`);
        expect(result).toEqual({
          character: "😀",
          codeUnitIndex: prefix.length,
          mode: "grade1",
          ok: false,
          reason: "unsupported-character",
          scalarIndex: Array.from(prefix).length,
        });
      }),
    );
  });

  it("translates a 1 MiB lowercase run in linear time", () => {
    const text = "a".repeat(1024 * 1024);
    const started = performance.now();
    const result = translateGrade1(text);
    const elapsed = performance.now() - started;

    expect(result.ok).toBe(true);
    expect(result.ok ? result.braille.length : 0).toBe(text.length);
    expect(elapsed).toBeLessThan(5_000);
  }, 10_000);
});
