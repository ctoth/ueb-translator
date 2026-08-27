import { describe, expect, it } from "vitest";

import {
  translateTechnical,
  translateTechnicalText,
  type TechnicalDocument,
} from "../src/technical.js";
import { fromBrf } from "./brf.js";

const internationalAllTechnical = {
  grade1: "all-technical",
  jurisdiction: "international",
  operationSpacing: "unspaced",
} as const;

describe("ICEB GTM 2014 sections 6-8 and 2018 section 3", () => {
  it("composes operations, comparisons, scripts, and radicals", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            comparison: "equals",
            kind: "comparison",
            left: { kind: "identifier", value: "y" },
            right: {
              kind: "radical",
              radicand: {
                kind: "operation",
                left: {
                  base: { kind: "identifier", value: "x" },
                  kind: "script",
                  placement: "right-superscript",
                  script: { kind: "number", value: "2" },
                },
                operation: "plus",
                right: { kind: "number", value: "1" },
              },
              root: "square",
            },
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';;;Y "7 %X9#B"6#A+;\''),
      mode: "technical",
      ok: true,
    });
  });

  it("delimits recursively nested general fractions", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            denominator: {
              denominator: { kind: "identifier", value: "z" },
              kind: "general-fraction",
              numerator: { kind: "identifier", value: "y" },
            },
            kind: "general-fraction",
            numerator: { kind: "identifier", value: "x" },
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(";;;(X./(Y./Z));'"),
      mode: "technical",
      ok: true,
    });
  });

  it("groups a negative multi-symbol superscript as one item", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            base: { kind: "identifier", value: "x" },
            kind: "script",
            placement: "right-superscript",
            script: {
              kind: "negation",
              operand: { kind: "number", value: "3" },
            },
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';;;X9<"-#C>;\''),
      mode: "technical",
      ok: true,
    });
  });
});

describe("BANA May 2026 regional supplement", () => {
  it("makes standardized and teaching operation spacing explicit", () => {
    const expression = {
      kind: "operation",
      left: { kind: "number", value: "3" },
      operation: "plus",
      right: { kind: "number", value: "2" },
    } as const;

    const standardized: TechnicalDocument = {
      blocks: [{ expression, kind: "expression" }],
      kind: "technical-document",
      profile: {
        grade1: "all-technical",
        jurisdiction: "bana-2026",
        production: "standardized",
      },
    };
    const teaching: TechnicalDocument = {
      blocks: [{ expression, kind: "expression" }],
      kind: "technical-document",
      profile: {
        grade1: "all-technical",
        jurisdiction: "bana-2026",
        production: "teaching",
      },
    };

    expect(translateTechnical(standardized)).toEqual({
      braille: fromBrf(';;;#C"6#B;\''),
      mode: "technical",
      ok: true,
    });
    expect(translateTechnical(teaching)).toEqual({
      braille: fromBrf(';;;#C "6 #B;\''),
      mode: "technical",
      ok: true,
    });
  });
});

describe("ICEB GTM replacement Section 1.7 (approved July 2025)", () => {
  it("uses symbol indicators at the exact ambiguous cells in a simple equation", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            comparison: "equals",
            kind: "comparison",
            left: { kind: "identifier", value: "y" },
            right: {
              kind: "operation",
              left: { kind: "identifier", value: "x" },
              operation: "plus",
              right: {
                items: [
                  { kind: "number", value: "4" },
                  { kind: "identifier", value: "c" },
                ],
                kind: "sequence",
              },
            },
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: {
        grade1: "preferred",
        jurisdiction: "international",
        operationSpacing: "unspaced",
      },
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';Y "7 X"6#D;C'),
      mode: "technical",
      ok: true,
    });
  });

  it("does not count the radical close as Grade 1 protection (issue #34)", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            comparison: "equals",
            kind: "comparison",
            left: {
              kind: "radical",
              radicand: { kind: "identifier", value: "x" },
              root: "square",
            },
            right: { kind: "number", value: "7" },
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: {
        grade1: "preferred",
        jurisdiction: "international",
        operationSpacing: "unspaced",
      },
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';%X+ "7 #G'),
      mode: "technical",
      ok: true,
    });
  });
});

describe("ICEB GTM 2014 sections 13, 16, and 17", () => {
  it("composes simple arrows and chemical formulae", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            items: [
              {
                base: { kind: "chemical-element", symbol: "H" },
                kind: "script",
                placement: "right-subscript",
                script: { kind: "number", value: "2" },
              },
              { kind: "chemical-element", symbol: "O" },
              { direction: "right", kind: "simple-arrow" },
            ],
            kind: "sequence",
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(";;;,H5#B,O\\O;'"),
      mode: "technical",
      ok: true,
    });
  });

  it("preserves raw computer line breaks without guessing syntax", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          grade: "grade1",
          kind: "computer",
          lines: ["const x = 1;", "return x;"],
          spacing: "ordinary",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    const result = translateTechnical(document);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.braille.split("\n")).toHaveLength(2);
    }
  });

  it("marks only the internal cells of a significant computer-space run", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          grade: "grade1",
          kind: "computer",
          lines: ["A    B"],
          spacing: "significant",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(",A ++ ,B"),
      mode: "technical",
      ok: true,
    });
  });

  it("indexes computer-block translation failures", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: { kind: "identifier", value: "x" },
          kind: "expression",
        },
        {
          grade: "grade1",
          kind: "computer",
          lines: ["ok", "A 😀"],
          spacing: "significant",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      blockIndex: 1,
      character: "😀",
      codeUnitIndex: 2,
      lineIndex: 1,
      mode: "technical",
      ok: false,
      reason: "unsupported-character",
      scalarIndex: 2,
    });
  });
});

describe("ICEB GTM 2014 sections 5, 9, 12, 14, and 15", () => {
  it("composes grouping, functions, modifiers, and shapes", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          expression: {
            items: [
              {
                argument: {
                  content: { kind: "identifier", value: "x" },
                  enclosure: "round",
                  kind: "group",
                },
                kind: "function",
                name: "sin",
              },
              {
                item: { kind: "identifier", value: "y" },
                kind: "modifier",
                modifier: "bar-above",
              },
              {
                fill: "outline",
                kind: "shape",
                shape: "square",
                terminator: "present",
              },
            ],
            kind: "sequence",
          },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';;;SIN"<X">Y:$#D:;\''),
      mode: "technical",
      ok: true,
    });
  });

  it("preserves matrix rows, columns, and enlarged grouping", () => {
    const document: TechnicalDocument = {
      blocks: [
        {
          columnGap: 1,
          enclosure: "round",
          kind: "matrix",
          rows: [
            [
              { kind: "number", value: "1" },
              { kind: "number", value: "0" },
            ],
            [
              { kind: "number", value: "0" },
              { kind: "number", value: "1" },
            ],
          ],
        },
      ],
      kind: "technical-document",
      profile: internationalAllTechnical,
    };

    expect(translateTechnical(document)).toEqual({
      braille: fromBrf(';;;,"<#A #J,">\n,"<#J #A,">;\''),
      mode: "technical",
      ok: true,
    });
  });
});

describe("raw technical text", () => {
  it("translates only the print identity that the caller actually supplied", () => {
    expect(translateTechnicalText("3+2=5")).toEqual({
      braille: "⠼⠉⠐⠖⠼⠃⠐⠶⠼⠑",
      mode: "technical-text",
      ok: true,
    });
  });

  it("does not invent a stacked fraction from a linear slash", () => {
    expect(translateTechnicalText("x/y")).toEqual({
      braille: "⠭⠸⠌⠽",
      mode: "technical-text",
      ok: true,
    });
  });
});
