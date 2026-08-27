import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { translateGrade2 } from "../src/grade2.js";
import {
  translateTechnical,
  translateTechnicalText,
  type SimpleArrowDirection,
  type TechnicalComparison,
  type TechnicalDocument,
  type TechnicalEnclosure,
  type TechnicalExpression,
  type TechnicalMatrixBlock,
  type TechnicalModifier,
  type TechnicalOperation,
  type TechnicalScriptPlacement,
  type TechnicalShapeName,
} from "../src/technical.js";
import { fromBrf } from "./brf.js";

const profile = {
  grade1: "all-technical",
  jurisdiction: "international",
  operationSpacing: "unspaced",
} as const;

function documentFor(expression: TechnicalExpression): TechnicalDocument {
  return {
    blocks: [{ expression, kind: "expression" }],
    kind: "technical-document",
    profile,
  };
}

function expressionBraille(expression: TechnicalExpression): string {
  const result = translateTechnical(documentFor(expression));
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return "";
  }
  return result.braille.slice(3, -2);
}

const operations: readonly (readonly [TechnicalOperation, string])[] = [
  ["asterisk", '"9'],
  ["divide", '"/'],
  ["dot", '"4'],
  ["minus", '"-'],
  ["multiply", '"8'],
  ["plus", '"6'],
  ["plus-or-minus", "_6"],
];

const comparisons: readonly (readonly [TechnicalComparison, string])[] = [
  ["approximately-equal", "_9"],
  ["equals", '"7'],
  ["greater-than", "@>"],
  ["greater-than-or-equal", "_@>"],
  ["less-than", "@<"],
  ["less-than-or-equal", "_@<"],
  ["not-equal", '"7@:'],
];

const scripts: readonly (readonly [TechnicalScriptPlacement, string])[] = [
  ["directly-above", "X.9#B"],
  ["directly-below", "X.5#B"],
  ["left-subscript", "5#BX"],
  ["left-superscript", "9#BX"],
  ["right-subscript", "X5#B"],
  ["right-superscript", "X9#B"],
];

const arrows: readonly (readonly [SimpleArrowDirection, string])[] = [
  ["down", "\\%"],
  ["down-left", "\\>"],
  ["down-right", "\\<"],
  ["left", "\\["],
  ["right", "\\O"],
  ["up", "\\+"],
  ["up-left", "\\:"],
  ["up-right", "\\S"],
];

const enclosures: readonly (readonly [TechnicalEnclosure, string])[] = [
  ["absolute", "_\\X_\\"],
  ["angle", "@<X@>"],
  ["curly", "_<X_>"],
  ["round", '"<X">'],
  ["square", ".<X.>"],
];

const modifiers: readonly (readonly [TechnicalModifier, string])[] = [
  ["arc-above", "X._:"],
  ["bar-above", "X:"],
  ["bar-below", "X,:"],
  ["dot-above", "X^4"],
  ["dot-below", "X,^4"],
  ["hat-above", 'X":'],
  ["hat-below", 'X,":'],
  ["line-through", "X@:"],
  ["right-arrow-above", "X^:"],
  ["right-arrow-below", "X,^:"],
  ["tilde-above", "X_:"],
  ["tilde-below", "X,_:"],
];

const shapeNames: readonly (readonly [TechnicalShapeName, string])[] = [
  ["circle", "="],
  ["hexagon", "#F"],
  ["heptagon", "#G"],
  ["octagon", "#H"],
  ["parallelogram", "@#D"],
  ["pentagon", "#E"],
  ["square", "#D"],
  ["triangle", "#C"],
];

describe("closed official GTM technical atoms", () => {
  it.each(operations)("emits operation %s", (operation, brf) => {
    expect(
      expressionBraille({
        kind: "operation",
        left: { kind: "number", value: "1" },
        operation,
        right: { kind: "number", value: "2" },
      }),
    ).toBe(fromBrf(`#A${brf}#B`));
  });

  it.each(comparisons)("emits comparison %s", (comparison, brf) => {
    expect(
      expressionBraille({
        comparison,
        kind: "comparison",
        left: { kind: "number", value: "1" },
        right: { kind: "number", value: "2" },
      }),
    ).toBe(fromBrf(`#A ${brf} #B`));
  });

  it.each(scripts)("emits script placement %s", (placement, brf) => {
    expect(
      expressionBraille({
        base: { kind: "identifier", value: "x" },
        kind: "script",
        placement,
        script: { kind: "number", value: "2" },
      }),
    ).toBe(fromBrf(brf));
  });

  it.each(arrows)("emits simple arrow %s", (direction, brf) => {
    expect(expressionBraille({ direction, kind: "simple-arrow" })).toBe(
      fromBrf(brf),
    );
  });

  it.each(enclosures)("emits enclosure %s", (enclosure, brf) => {
    expect(
      expressionBraille({
        content: { kind: "identifier", value: "x" },
        enclosure,
        kind: "group",
      }),
    ).toBe(fromBrf(brf));
  });

  it.each(modifiers)("emits modifier %s", (modifier, brf) => {
    expect(
      expressionBraille({
        item: { kind: "identifier", value: "x" },
        kind: "modifier",
        modifier,
      }),
    ).toBe(fromBrf(brf));
  });

  it.each(shapeNames)("emits shape %s", (shape, brf) => {
    expect(
      expressionBraille({
        fill: "outline",
        kind: "shape",
        shape,
        terminator: "omitted",
      }),
    ).toBe(fromBrf(`$${brf}`));
  });

  it.each([
    ["filled", "_$"],
    ["outline", "$"],
    ["shaded", ".$"],
  ] as const)("emits shape fill %s", (fill, brf) => {
    expect(
      expressionBraille({
        fill,
        kind: "shape",
        shape: "circle",
        terminator: "present",
      }),
    ).toBe(fromBrf(`${brf}=:`));
  });
});

describe("closed technical layouts and failures", () => {
  it.each([
    ["curly", ',_<#A,_>'],
    ["determinant", ',_\\#A,_\\'],
    ["round", ',"<#A,">'],
    ["square", ',.<#A,.>'],
  ] as const)("emits enlarged %s matrix grouping", (enclosure, brf) => {
    const matrix: TechnicalMatrixBlock = {
      columnGap: 2,
      enclosure,
      kind: "matrix",
      rows: [[{ kind: "number", value: "1" }]],
    };
    expect(
      translateTechnical({
        blocks: [matrix],
        kind: "technical-document",
        profile,
      }),
    ).toEqual({
      braille: fromBrf(`;;;${brf};'`),
      mode: "technical",
      ok: true,
    });
  });

  it("rejects a ragged matrix", () => {
    expect(
      translateTechnical({
        blocks: [
          {
            columnGap: 1,
            enclosure: "round",
            kind: "matrix",
            rows: [
              [
                { kind: "number", value: "1" },
                { kind: "number", value: "2" },
              ],
              [{ kind: "number", value: "3" }],
            ],
          },
        ],
        kind: "technical-document",
        profile,
      }),
    ).toMatchObject({ ok: false, reason: "ragged-matrix", rowIndex: 1 });
  });

  it.each([
    [{ kind: "chemical-element", symbol: "h" }, "chemical-element"],
    [{ kind: "function", name: "sin2", argument: { kind: "number", value: "1" } }, "function-name"],
    [{ kind: "identifier", value: "" }, "identifier"],
    [{ kind: "number", value: "1x" }, "number"],
    [{ kind: "simple-fraction", numerator: "x", denominator: "2" }, "simple-fraction-numerator"],
    [{ kind: "simple-fraction", numerator: "1", denominator: "y" }, "simple-fraction-denominator"],
  ] satisfies readonly (readonly [TechnicalExpression, string])[])(
    "rejects invalid structured value %#",
    (expression, kind) => {
      expect(translateTechnical(documentFor(expression))).toMatchObject({
        kind,
        ok: false,
        reason: "invalid-value",
      });
    },
  );

  it("reports unsupported raw and structured characters", () => {
    expect(translateTechnicalText("a😀")).toMatchObject({
      character: "😀",
      ok: false,
      reason: "unsupported-character",
    });
    expect(
      translateTechnical(documentFor({ kind: "identifier", value: "漢" })),
    ).toMatchObject({ character: "漢", ok: false });
  });

  const invalidIdentifier: TechnicalExpression = {
    kind: "identifier",
    value: "",
  };

  it.each([
    { comparison: "equals", kind: "comparison", left: invalidIdentifier, right: { kind: "number", value: "1" } },
    { comparison: "equals", kind: "comparison", left: { kind: "number", value: "1" }, right: invalidIdentifier },
    { denominator: { kind: "number", value: "1" }, kind: "general-fraction", numerator: invalidIdentifier },
    { denominator: invalidIdentifier, kind: "general-fraction", numerator: { kind: "number", value: "1" } },
    { content: invalidIdentifier, enclosure: "round", kind: "group" },
    { argument: invalidIdentifier, kind: "function", name: "sin" },
    { item: invalidIdentifier, kind: "modifier", modifier: "bar-above" },
    { kind: "negation", operand: invalidIdentifier },
    { kind: "operation", left: invalidIdentifier, operation: "plus", right: { kind: "number", value: "1" } },
    { kind: "operation", left: { kind: "number", value: "1" }, operation: "plus", right: invalidIdentifier },
    { kind: "radical", radicand: invalidIdentifier, root: "square" },
    { index: invalidIdentifier, kind: "radical", radicand: { kind: "number", value: "2" }, root: "indexed" },
    { index: { kind: "number", value: "3" }, kind: "radical", radicand: invalidIdentifier, root: "indexed" },
    { base: invalidIdentifier, kind: "script", placement: "right-superscript", script: { kind: "number", value: "2" } },
    { base: { kind: "identifier", value: "x" }, kind: "script", placement: "right-superscript", script: invalidIdentifier },
    { items: [{ kind: "number", value: "1" }, invalidIdentifier], kind: "sequence" },
  ] satisfies readonly TechnicalExpression[])(
    "propagates invalid nested value %#",
    (expression) => {
      expect(translateTechnical(documentFor(expression))).toMatchObject({
        ok: false,
        reason: "invalid-value",
      });
    },
  );

  it("propagates an invalid matrix cell", () => {
    expect(
      translateTechnical({
        blocks: [
          {
            columnGap: 1,
            enclosure: "round",
            kind: "matrix",
            rows: [[invalidIdentifier]],
          },
        ],
        kind: "technical-document",
        profile,
      }),
    ).toMatchObject({ ok: false, reason: "invalid-value" });
  });

  it("handles indexed roots and recursively scoped modifier/script items", () => {
    expect(
      expressionBraille({
        index: { kind: "number", value: "3" },
        kind: "radical",
        radicand: { kind: "number", value: "8" },
        root: "indexed",
      }),
    ).toBe(fromBrf("%9#C#H+"));
    expect(
      expressionBraille({
        base: { kind: "identifier", value: "x" },
        kind: "script",
        placement: "right-superscript",
        script: {
          item: { kind: "identifier", value: "y" },
          kind: "modifier",
          modifier: "bar-above",
        },
      }),
    ).toBe(fromBrf("X9Y:"));
    expect(
      expressionBraille({
        base: { kind: "identifier", value: "x" },
        kind: "script",
        placement: "right-superscript",
        script: {
          base: { kind: "identifier", value: "y" },
          kind: "script",
          placement: "right-subscript",
          script: { kind: "number", value: "2" },
        },
      }),
    ).toBe(fromBrf("X9Y5#B"));
  });

  it("classifies every closed expression variant as an item or group", () => {
    const variants: readonly TechnicalExpression[] = [
      { kind: "chemical-element", symbol: "H" },
      { comparison: "equals", kind: "comparison", left: { kind: "number", value: "1" }, right: { kind: "number", value: "2" } },
      { denominator: { kind: "number", value: "2" }, kind: "general-fraction", numerator: { kind: "identifier", value: "x" } },
      { content: { kind: "identifier", value: "x" }, enclosure: "round", kind: "group" },
      { kind: "identifier", value: "x" },
      { argument: { kind: "number", value: "2" }, kind: "function", name: "sin" },
      { item: { kind: "identifier", value: "x" }, kind: "modifier", modifier: "bar-above" },
      { kind: "negation", operand: { kind: "number", value: "2" } },
      { kind: "number", value: "2" },
      { kind: "operation", left: { kind: "number", value: "1" }, operation: "plus", right: { kind: "number", value: "2" } },
      { kind: "radical", radicand: { kind: "number", value: "2" }, root: "square" },
      { base: { kind: "identifier", value: "x" }, kind: "script", placement: "right-subscript", script: { kind: "number", value: "2" } },
      { items: [{ kind: "identifier", value: "x" }, { kind: "number", value: "2" }], kind: "sequence" },
      { fill: "outline", kind: "shape", shape: "circle", terminator: "omitted" },
      { direction: "right", kind: "simple-arrow" },
      { denominator: "2", kind: "simple-fraction", numerator: "1" },
    ];
    for (const script of variants) {
      expect(
        translateTechnical(
          documentFor({
            base: { kind: "identifier", value: "x" },
            kind: "script",
            placement: "right-superscript",
            script,
          }),
        ).ok,
      ).toBe(true);
    }
  });

  it("covers explicit computer grade and spacing policies", () => {
    const blocks: TechnicalDocument["blocks"] = [
      {
        grade: "grade2",
        kind: "computer",
        lines: ["about"],
        spacing: "ordinary",
        translator: translateGrade2,
      },
      {
        grade: "grade1",
        kind: "computer",
        lines: ["ABC  DEF"],
        spacing: "significant",
      },
    ];
    const result = translateTechnical({
      blocks,
      kind: "technical-document",
      profile,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.braille).toContain("\n");
    }

    for (const block of [
      { grade: "grade1", kind: "computer", lines: ["😀"], spacing: "ordinary" },
      { grade: "grade2", kind: "computer", lines: ["😀"], spacing: "ordinary", translator: translateGrade2 },
      { grade: "grade1", kind: "computer", lines: ["A 😀"], spacing: "significant" },
    ] as const) {
      expect(
        translateTechnical({
          blocks: [block],
          kind: "technical-document",
          profile,
        }),
      ).toMatchObject({ ok: false, reason: "unsupported-character" });
    }
  });
});

describe("preferred grade-1 scope edges", () => {
  const preferred = {
    grade1: "preferred",
    jurisdiction: "international",
    operationSpacing: "spaced",
  } as const;

  it("distinguishes no indicator, word indicator, and passage escalation", () => {
    expect(
      translateTechnical({
        blocks: [{ expression: { kind: "identifier", value: "a" }, kind: "expression" }],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({ braille: fromBrf("A"), ok: true });
    expect(
      translateTechnical({
        blocks: [{ expression: { kind: "identifier", value: "speed" }, kind: "expression" }],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({ braille: fromBrf(";;SPEED"), ok: true });

    const chain: TechnicalExpression = {
      comparison: "equals",
      kind: "comparison",
      left: {
        comparison: "equals",
        kind: "comparison",
        left: { kind: "identifier", value: "x" },
        right: { kind: "identifier", value: "y" },
      },
      right: { kind: "identifier", value: "z" },
    };
    expect(
      translateTechnical({
        blocks: [{ expression: chain, kind: "expression" }],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({
      braille: fromBrf(';;;X "7 Y "7 Z;\''),
      ok: true,
    });
    expect(
      translateTechnical({
        blocks: [
          {
            expression: { items: [], kind: "sequence" },
            kind: "expression",
          },
        ],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({ braille: "", ok: true });
  });

  it("excludes a-j following numbers from the passage threshold", () => {
    const numericLetter = (number: string, letter: string): TechnicalExpression => ({
      items: [
        { kind: "number", value: number },
        { kind: "identifier", value: letter },
      ],
      kind: "sequence",
    });
    const expression: TechnicalExpression = {
      comparison: "equals",
      kind: "comparison",
      left: {
        comparison: "equals",
        kind: "comparison",
        left: numericLetter("1", "a"),
        right: numericLetter("2", "b"),
      },
      right: numericLetter("3", "c"),
    };
    expect(
      translateTechnical({
        blocks: [{ expression, kind: "expression" }],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({
      braille: fromBrf('#A;A "7 #B;B "7 #C;C'),
      ok: true,
    });

    expect(
      translateTechnical({
        blocks: [
          {
            expression: {
              denominator: { kind: "number", value: "2" },
              kind: "general-fraction",
              numerator: numericLetter("1", "a"),
            },
            kind: "expression",
          },
        ],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({ braille: fromBrf(";(#A;A./#B)"), ok: true });
  });

  it("spaces an international teaching operation and a lowercase function argument", () => {
    expect(
      translateTechnical({
        blocks: [
          {
            expression: {
              kind: "operation",
              left: { kind: "number", value: "1" },
              operation: "plus",
              right: {
                argument: { kind: "identifier", value: "x" },
                kind: "function",
                name: "sin",
              },
            },
            kind: "expression",
          },
        ],
        kind: "technical-document",
        profile: preferred,
      }),
    ).toMatchObject({ braille: fromBrf('#A "6 SIN ;X'), ok: true });
  });
});

describe("technical translation properties", () => {
  const leaf = fc.constantFrom<TechnicalExpression>(
    { kind: "identifier", value: "x" },
    { kind: "number", value: "12" },
    { direction: "right", kind: "simple-arrow" },
    {
      denominator: "3",
      kind: "simple-fraction",
      numerator: "2",
    },
  );
  const expression = fc.oneof(
    leaf,
    fc
      .tuple(leaf, fc.constantFrom(...operations.map(([operation]) => operation)), leaf)
      .map(
        ([left, operation, right]): TechnicalExpression => ({
          kind: "operation",
          left,
          operation,
          right,
        }),
      ),
  );

  it("emits only Unicode Braille cells or line breaks", () => {
    fc.assert(
      fc.property(expression, (generated) => {
        const translated = translateTechnical(documentFor(generated));
        expect(translated.ok).toBe(true);
        if (translated.ok) {
          expect(translated.braille).toMatch(/^[\u2800-\u28ff\n]*$/u);
        }
      }),
    );
  });
});
