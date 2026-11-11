import { describe, expect, it } from "vitest";

import {
  COMPOSITION_POLICY_COMPILATION,
  GRADE1_MODE_COMPILATION,
  GRADE1_SYMBOL_COMPILATION,
} from "../rules/ueb-2024/grade1-program.js";
import {
  COMPOSITION_POLICY_RULE_IDS,
  GRADE1_MODE_RULE_IDS,
  GRADE1_SYMBOL_RULE_IDS,
} from "../src/generated/ueb-2024/grade1-provenance.js";
import {
  compileCompositionPolicies,
  type CompositionPolicySource,
} from "../rules/ueb-2024/policies/compiler.js";
import { COMPOSITION_POLICY_RULES } from "../rules/ueb-2024/policies/source.js";
import {
  compileModes,
  type ModeCompilationError,
} from "../rules/ueb-2024/modes/compiler.js";
import { MODE_RULES } from "../rules/ueb-2024/modes/source.js";
import { GRADE1_VOCABULARY, orderedNames, readGrade1Vocabulary } from "../rules/ueb-2024/grade1-vocabulary.js";
import {
  compileSymbols,
  type SymbolCompilationError,
  type SymbolRuleSource,
} from "../rules/ueb-2024/symbols/compiler.js";
import { citeIceb } from "../rules/ueb-2024/source.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import { compileTechnicalSigns } from "../rules/ueb-2024/technical-signs.js";
import { sourceData } from "../rules/ueb-2024/source-manifest.js";
import { TECHNICAL_ARROW_DIRECTIONS, TECHNICAL_VALUE_KINDS, TECHNICAL_COMPARISONS, TECHNICAL_OPERATIONS, TECHNICAL_DELIMITER_SIGNS,
  TECHNICAL_ENCLOSURES } from "../src/technical-program.js";
import {
  indicatorKind,
  modeIndicator,
  scanModeSpan,
  type ModeProgram,
} from "../src/mode-engine.js";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function recordOf(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) throw new Error("Expected a record.");
  return value;
}
function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
function arrayOf(value: unknown): readonly unknown[] {
  if (!isList(value)) throw new Error("Expected a list.");
  return value;
}
/** A copy of a JSON record with the value at a record path replaced. */
function replaced(value: unknown, path: readonly string[], replacement: unknown): unknown {
  const [key, ...rest] = path;
  if (key === undefined) return replacement;
  const node = recordOf(value);
  return { ...node, [key]: replaced(node[key], rest, replacement) };
}

function symbol(id: string, print: string): SymbolRuleSource {
  return {
    braille: "⠁",
    citation: citeIceb("4.1.1"),
    id,
    kind: "symbol",
    numericDigit: null,
    print,
    uppercasePrint: null,
  };
}

describe("declarative Grade 1 vocabulary", () => {
  it("uses declared IDs for mode order, class masks and provenance", () => {
    const vocabulary = structuredClone(GRADE1_VOCABULARY);
    Object.assign(vocabulary.modes, { capitals: 2, numeric: 0 });
    Object.assign(vocabulary.classes, { digit: 7, "uppercase-letter": 0 });
    Object.assign(vocabulary.policies, { closingStandingPunctuation: 5, standingBoundaries: 0 });
    const compiled = compileModes([...MODE_RULES].reverse(), vocabulary);
    const numeric = MODE_RULES.find(rule => rule.name === "numeric");
    if (numeric === undefined) throw new Error("Missing numeric mode.");
    expect(compiled.provenance[0]).toBe(numeric);
    expect(compiled.runtime.modes[0]?.[1]).toBe(7);
    expect(compiled.classIds.get("digit")).toBe(7);
    expect(compiled.modeIds.get("capitals")).toBe(2);
    const numericContinues = compiled.runtime.modes[0]?.[4];
    expect(numericContinues).toBe(numeric.definition.continuesThrough
      .reduce((mask, name) => mask | 2 ** vocabulary.classes[name], 0));
    const policies = compileCompositionPolicies(COMPOSITION_POLICY_RULES, vocabulary);
    expect(policies.provenance[0]?.name).toBe("standingBoundaries");
    expect(policies.runtime).toEqual(COMPOSITION_POLICY_COMPILATION.runtime);
    expect(orderedNames({ second: 1, first: 0 })).toEqual(["first", "second"]);
  });

  it("rejects missing or unknown names and non-dense IDs", () => {
    expect(() => readGrade1Vocabulary(null)).toThrow("Expected a Grade 1 vocabulary.");
    expect(() => readGrade1Vocabulary({ ...GRADE1_VOCABULARY, extra: {} })).toThrow("Expected a Grade 1 vocabulary.");
    const missing = Object.fromEntries(Object.entries(GRADE1_VOCABULARY.classes).filter(([name]) => name !== "digit"));
    for (const classes of [missing, { ...GRADE1_VOCABULARY.classes, extra: 8 },
      { ...GRADE1_VOCABULARY.classes, digit: 1 },
      { ...GRADE1_VOCABULARY.classes, digit: -1 },
      { ...GRADE1_VOCABULARY.classes, digit: 8 },
      { ...GRADE1_VOCABULARY.classes, digit: 0.5 },
      { ...GRADE1_VOCABULARY.classes, digit: true },
    ]) {
      expect(() => readGrade1Vocabulary({ ...GRADE1_VOCABULARY, classes })).toThrow();
    }
    expect(() => compileModes(MODE_RULES, {
      ...GRADE1_VOCABULARY, modes: { ...GRADE1_VOCABULARY.modes, capitals: 1 },
    })).toThrow("unique and dense");
  });
});

describe("compiled composition policies", () => {
  it("compiles every cited policy into generated closed data", () => {
    const runtime = COMPOSITION_POLICY_COMPILATION.runtime;
    expect(runtime.closingStandingPunctuation).toContain(")");
    expect(runtime.lowerPunctuation).toContain("?");
    expect(runtime.openingStandingPunctuation).toContain("(");
    expect(runtime.standingBoundaries).toContain(" ");
    expect(runtime.dashJoiners).toContain("-");
    expect(runtime.elisionPunctuation).toContain("’");
    expect(runtime.standingSuffixes).toBe("s");
    expect(COMPOSITION_POLICY_RULE_IDS).toHaveLength(7);
  });

  it("rejects duplicate, missing, malformed, and uncited policies", () => {
    const first = COMPOSITION_POLICY_RULES[0];
    if (first === undefined) throw new Error("Policy fixture is empty.");
    const compile = (replacement: CompositionPolicySource): void => {
      compileCompositionPolicies([
        replacement,
        ...COMPOSITION_POLICY_RULES.slice(1),
      ]);
    };
    expect(() => compileCompositionPolicies([...COMPOSITION_POLICY_RULES, first]))
      .toThrow("not closed cited data");
    expect(() => { compile({ ...first, name: "lowerPunctuation" }); })
      .toThrow("not closed cited data");
    expect(() => { compile({ ...first, members: [] }); })
      .toThrow("not closed cited data");
    expect(() => { compile({ ...first, members: [")", ")"] }); })
      .toThrow("not closed cited data");
    expect(() => { compile({ ...first, members: ["ab"] }); })
      .toThrow("not closed cited data");
    const uncited = structuredClone(first);
    Object.defineProperty(uncited.citation, "authority", { value: "BANA" });
    expect(() => { compile(uncited); }).toThrow("not closed cited data");
    expect(() => compileCompositionPolicies(COMPOSITION_POLICY_RULES.slice(0, -1)))
      .toThrow("is missing");
  });
});

describe("compiled Grade 1 symbols", () => {
  it("compiles the complete cited inventory including U+0060 and U+007C", () => {
    const grave = GRADE1_SYMBOL_COMPILATION.provenance.find(
      (rule) => rule.print === "`",
    );
    const vertical = GRADE1_SYMBOL_COMPILATION.provenance.find(
      (rule) => rule.print === "|",
    );
    expect(GRADE1_SYMBOL_COMPILATION.runtime.symbols.length).toBeGreaterThan(100);
    expect(grave).toEqual(expect.objectContaining({
      braille: "⠨⠡",
      id: "UEB-symbol-60",
    }));
    expect(grave?.citation.locator).toBe("Symbols list: U+0060");
    expect(vertical).toEqual(expect.objectContaining({
      braille: "⠸⠳",
      id: "UEB-symbol-007c-vertical-bar",
    }));
    expect(vertical?.citation.locator).toBe("Symbols list: U+007C");
    expect(GRADE1_SYMBOL_RULE_IDS).toHaveLength(
      GRADE1_SYMBOL_COMPILATION.provenance.length,
    );
  });

  it("rejects duplicate print scalars, identifiers, and missing official citations", () => {
    expect(() => compileSymbols([symbol("one", "a"), symbol("two", "a")]))
      .toThrow(expect.objectContaining<Partial<SymbolCompilationError>>({
        code: "conflicting-print",
      }));
    expect(() => compileSymbols([symbol("one", "a"), symbol("one", "b")]))
      .toThrow(expect.objectContaining<Partial<SymbolCompilationError>>({
        code: "conflicting-rule-id",
      }));
    const uncited = structuredClone(symbol("uncited", "a"));
    Object.defineProperty(uncited.citation, "authority", { value: "BANA" });
    expect(() => compileSymbols([uncited])).toThrow(
      expect.objectContaining<Partial<SymbolCompilationError>>({ code: "uncited-rule" }),
    );
  });

  it("rejects every malformed scalar-table shape", () => {
    expect(() => compileSymbols([{ ...symbol("two-scalars", "a"), print: "ab" }]))
      .toThrow(expect.objectContaining({ code: "malformed-rule" }));
    expect(() => compileSymbols([{ ...symbol("empty-braille", "a"), braille: "" }]))
      .toThrow(expect.objectContaining({ code: "malformed-rule" }));
    expect(() => compileSymbols([{ ...symbol("print-braille", "a"), braille: "x" }]))
      .toThrow(expect.objectContaining({ code: "malformed-rule" }));
  });
});

describe("compiled technical signs", () => {
  /** Compile with one routed technical source changed at a record path. */
  const changed = (name: string, path: readonly string[], value: unknown) =>
    compileTechnicalSigns({ [name]: replaced(sourceData("technical", "inputs", name), path, value) });
  const definitions = (name: string): Readonly<Record<string, unknown>> =>
    recordOf(recordOf(sourceData("technical", "inputs", name))["definitions"]);

  it("compiles significant computer whitespace and rejects malformed definitions", () => {
    const whitespace = { visibleSpace: "⠿", minimumRunLength: 5, ordinaryEdgeLength: 2 };
    expect(changed("computerWhitespace", ["definitions"], whitespace)["computerWhitespace"]).toEqual(whitespace);
    for (const [field, value] of [
      ["visibleSpace", ""], ["visibleSpace", "⠿⠿"], ["minimumRunLength", 2.5], ["ordinaryEdgeLength", 0.5],
      ["ordinaryEdgeLength", -1], ["minimumRunLength", 2],
    ] as const) {
      expect(() => changed("computerWhitespace", ["definitions", field], value)).toThrow("malformed definitions");
    }
  });

  it.each(["computerWhitespace", "numericContinuation", "functionSpacing", "protection", "items",
    "delimiters", "scripts", "modifiers", "shapes"])("rejects %s without a citation locator", (name) => {
    expect(() => changed(name, ["citation", "locator"], "")).toThrow("Empty citation locator.");
  });

  it.each(["international", "bana-2026"])("rejects operation spacing without a %s citation locator", (jurisdiction) => {
    expect(() => changed("spacing", [jurisdiction, "citation", "locator"], " ")).toThrow("Empty citation locator.");
  });

  it.each(["", "("])("rejects invalid numeric continuation pattern %j", (identifierPattern) => {
    expect(() => changed("numericContinuation", ["definitions", "identifierPattern"], identifierPattern)).toThrow();
  });

  it("compiles numeric continuation selectors from the source descriptor", () => {
    const selectors = { precedingKinds: ["number", "identifier"], identifierPattern: "^[b-d]" };
    expect(changed("numericContinuation", ["definitions"], selectors)["numericContinuation"]).toEqual(selectors);
    expect(() => changed("numericContinuation", ["definitions", "precedingKinds"], ["undeclared"]))
      .toThrow("undeclared expression kind");
  });

  it("derives function spacing cells from the selected shared symbols", () => {
    const changedSymbols = SYMBOL_RULES.map((rule) =>
      rule.print === "x" ? { ...rule, braille: "⠿" } : rule);
    const spacing = { functionSpacing: replaced(sourceData("technical", "inputs", "functionSpacing"),
      ["definitions"], { letterPrintPattern: "^x$", namePattern: "^[a-m]" }) };
    expect(compileTechnicalSigns(spacing, changedSymbols)["functionSpacing"])
      .toEqual({ letterCells: ["⠿"], namePattern: "^[a-m]" });
  });

  it.each(["letterPrintPattern", "namePattern"])("rejects malformed function spacing %s", (pattern) => {
    expect(() => changed("functionSpacing", ["definitions", pattern], "(")).toThrow();
  });

  it("preserves ordered standing classifiers and compiles protection thresholds", () => {
    expect(compileTechnicalSigns()["grade1Protection"]).toEqual({
      standingValues: [
        { pattern: "^[b-hj-np-z]$", flags: "iu", kind: "standing-symbol" },
        { pattern: "^\\p{L}[\\p{L}\\p{M}\\d]+$", flags: "u", kind: "standing-word" },
      ],
      maxSymbolsPerSequence: 1,
      passageSequenceThreshold: 3,
    });
  });

  it.each([
    ["maxSymbolsPerSequence", 0],
    ["maxSymbolsPerSequence", 2 ** 53],
    ["passageSequenceThreshold", 1.5],
    ["passageSequenceThreshold", Infinity],
    ["passageSequenceThreshold", "3"],
    ["standingValues", []],
    ...["", "("].map((pattern) => ["standingValues", [{ pattern, flags: "u", kind: "standing-word" }]] as const),
    ["standingValues", [{ pattern: "x", flags: "g", kind: "standing-symbol" }]],
    ["standingValues", [{ pattern: "x", flags: "u", kind: "numeric-mode" }]],
  ] as const)("rejects malformed Grade 1 protection %s %j", (field, value) => {
    expect(() => changed("protection", ["definitions", field], value)).toThrow();
  });

  it.each(TECHNICAL_VALUE_KINDS)("rejects malformed %s input patterns", (kind) => {
    for (const pattern of ["", "(", 1]) {
      expect(() => changed("valuePatterns", [kind], pattern)).toThrow();
    }
  });

  it.each([
    ...TECHNICAL_ARROW_DIRECTIONS.map((name) => ["arrows", name] as const),
    ...TECHNICAL_OPERATIONS.map((name) => ["operations", name] as const),
    ...TECHNICAL_COMPARISONS.map((name) => ["comparisons", name] as const),
  ])("rejects a missing %s reference for %s", (group, name) => {
    expect(() => changed("mappings", [group, name], "missing")).toThrow("references missing symbol");
  });

  it.each(["", "("])("rejects an invalid item identifier pattern %j", (identifierPattern) => {
    expect(() => changed("items", ["definitions", "identifierPattern"], identifierPattern)).toThrow();
  });

  it("resolves ordinary and enlarged enclosures through the shared symbols", () => {
    expect(compileTechnicalSigns()["delimiters"]).toMatchObject({
      enclosures: { round: { open: "⠐⠣", close: "⠐⠜" } },
      matrixEnclosures: { determinant: { open: "⠠⠸⠳", close: "⠠⠸⠳" } },
    });
    const changedSymbols = SYMBOL_RULES.map((rule) =>
      rule.print === "(" ? { ...rule, braille: "⠁⠃" } : rule);
    expect(compileTechnicalSigns({}, changedSymbols)["delimiters"]).toMatchObject({
      enclosures: { round: { open: "⠁⠃" } }, matrixEnclosures: { round: { open: "⠠⠁⠃" } },
    });
  });

  it.each([...TECHNICAL_DELIMITER_SIGNS, "enlargedPrefix"])("rejects malformed delimiter cells for %s", (name) => {
    for (const cells of ["", "print"]) {
      expect(() => changed("delimiters", ["definitions", name], cells)).toThrow("malformed cells");
    }
  });

  it.each(TECHNICAL_ENCLOSURES)("rejects missing %s enclosure symbols", (name) => {
    for (const side of ["open", "close"]) {
      for (const print of ["missing", false]) {
        expect(() => changed("delimiters", ["definitions", "enclosures", name, side], print))
          .toThrow("references missing symbol");
      }
    }
  });

  it("rejects an unknown matrix enclosure reference", () => {
    expect(() => changed("delimiters", ["definitions", "matrixEnclosures", "round"], "missing"))
      .toThrow("declared enclosures");
  });

  it("emits only additions without copying shared symbol definitions", () => {
    const program = compileTechnicalSigns();
    const symbols = program["symbols"];
    expect(symbols).toHaveLength(6);
    expect(program["itemPolicy"]).toEqual(definitions("items"));
    expect(program["valuePatterns"]).toEqual(sourceData("technical", "inputs", "valuePatterns"));
    const generalPrints = new Set(SYMBOL_RULES.map((rule) => rule.print));
    expect(Array.isArray(symbols) && symbols.some((entry) => generalPrints.has(String(recordOf(entry)["print"]))))
      .toBe(false);
    expect(program["shapes"]).toEqual(definitions("shapes"));
  });

  it("rejects additions that overwrite general symbol definitions", () => {
    const additions = [...arrayOf(sourceData("technical", "inputs", "symbols")),
      { ...symbol("test-duplicate-plus", "+"), citation: { source: "ueb-2024", locator: "4.1.1" } }];
    expect(() => compileTechnicalSigns({ symbols: additions }))
      .toThrow(expect.objectContaining({ code: "conflicting-print" }));
  });

  it.each(["", "not-braille", 2])("rejects malformed script indicator %j", (indicator) => {
    expect(() => changed("scripts", ["definitions", "left-superscript", "indicator"], indicator))
      .toThrow(indicator === 2 ? "Expected text" : "malformed indicator");
  });

  it.each(["", "not-braille"])("rejects malformed modifier cells %j", (cells) => {
    expect(() => changed("modifiers", ["definitions", "bar-above"], cells)).toThrow("malformed cells");
  });

  it.each(["", "not-braille"])("rejects malformed shape cells %j", (cells) => {
    for (const path of [["definitions", "fills", "outline"], ["definitions", "names", "circle"], ["definitions", "terminator"]]) {
      expect(() => changed("shapes", path, cells)).toThrow("malformed cells");
    }
  });
});

describe("compiled closed mode engine", () => {
  it("compiles all modes as callback-free tuples and bitsets", () => {
    expect(GRADE1_MODE_COMPILATION.runtime.modes).toHaveLength(8);
    expect(JSON.stringify(GRADE1_MODE_COMPILATION.runtime)).not.toContain("function");
    expect(MODE_RULES.every((rule) =>
      Object.keys(rule.definition).sort().join(",") ===
        "continuesThrough,indicators,memberClass,passageThreshold,terminatedBy"
    )).toBe(true);
    expect(GRADE1_MODE_RULE_IDS).toHaveLength(
      GRADE1_MODE_COMPILATION.provenance.length,
    );
  });

  it("interprets opaque ids without a per-mode hook", () => {
    const program: ModeProgram = {
      modes: [[
        ["s", "w", "p", "t"],
        0,
        3,
        2 ** 1,
        0,
      ]],
    };
    const span = scanModeSpan(
      program,
      0,
      [1, 4, 1],
      0,
      2,
    );
    expect(span).toEqual({ end: 3, memberCount: 2, sequenceCount: 2 });
    expect(indicatorKind(program, 0, 1, 1)).toBe("symbol");
    expect(modeIndicator(program, 0, "passage")).toBe("p");
    expect(() => modeIndicator(program, 1, "symbol"))
      .toThrow("has no mode 1");
    expect(scanModeSpan(program, 0, [1], 0, 2))
      .toEqual({ end: 1, memberCount: 1, sequenceCount: 1 });
  });

  it("rejects duplicate modes", () => {
    expect(() => compileModes([MODE_RULES[0], MODE_RULES[0]].filter(
      (rule) => rule !== undefined,
    ))).toThrow(expect.objectContaining<Partial<ModeCompilationError>>({
      code: "conflicting-rule-id",
    }));
  });

  it("rejects conflicting, incomplete, and malformed mode definitions", () => {
    const first = MODE_RULES[0];
    if (first === undefined) throw new Error("Mode fixture is empty.");
    expect(() => compileModes([
      ...MODE_RULES,
      { ...first, id: "test-conflicting-capitals" },
    ])).toThrow(expect.objectContaining({ code: "conflicting-mode" }));
    expect(() => compileModes(MODE_RULES.slice(0, -1)))
      .toThrow(expect.objectContaining({ code: "malformed-mode" }));
    const uncited = structuredClone(first);
    Object.defineProperty(uncited.citation, "authority", { value: "BANA" });
    expect(() => compileModes(MODE_RULES.map((mode) =>
      mode === first ? uncited : mode
    ))).toThrow(expect.objectContaining({ code: "uncited-rule" }));

    const malformedDefinitions = [
      { ...first.definition, passageThreshold: 0 },
      { ...first.definition, indicators: { ...first.definition.indicators, symbol: "" } },
      { ...first.definition, indicators: { ...first.definition.indicators, word: "" } },
      { ...first.definition, indicators: { ...first.definition.indicators, passage: "" } },
      { ...first.definition, continuesThrough: [first.definition.memberClass] },
      { ...first.definition, terminatedBy: [first.definition.memberClass] },
      {
        ...first.definition,
        continuesThrough: ["digit"],
        terminatedBy: ["digit"],
      },
    ] satisfies readonly (typeof first.definition)[];
    for (const [index, definition] of malformedDefinitions.entries()) {
      expect(() => compileModes(MODE_RULES.map((mode) =>
        mode === first ? { ...first, definition, id: `test-malformed-${String(index)}` } : mode
      ))).toThrow(expect.objectContaining({ code: "malformed-mode" }));
    }
  });
});
