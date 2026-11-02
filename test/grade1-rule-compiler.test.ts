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
import {
  compileSymbols,
  type SymbolCompilationError,
  type SymbolRuleSource,
} from "../rules/ueb-2024/symbols/compiler.js";
import { citeIceb } from "../rules/ueb-2024/source.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import {
  compileTechnicalSigns, TECHNICAL_FUNCTION_SPACING_RULES, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_ITEM_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SCRIPT_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SYMBOL_RULES,
} from "../rules/ueb-2024/technical-signs.js";
import { TECHNICAL_ARROW_DIRECTIONS, TECHNICAL_VALUE_KINDS, TECHNICAL_COMPARISONS, TECHNICAL_OPERATIONS, TECHNICAL_DELIMITER_SIGNS,
  TECHNICAL_ENCLOSURES } from "../src/technical-program.js";
import {
  indicatorKind,
  modeIndicator,
  scanModeSpan,
  type ModeProgram,
} from "../src/mode-engine.js";

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

describe("compiled composition policies", () => {
  it("compiles every cited policy into generated closed data", () => {
    const runtime = COMPOSITION_POLICY_COMPILATION.runtime;
    expect(runtime.closingStandingPunctuation).toContain(")");
    expect(runtime.lowerPunctuation).toContain("?");
    expect(runtime.openingStandingPunctuation).toContain("(");
    expect(runtime.standingBoundaries).toContain(" ");
    expect(runtime.dashJoiners).toContain("-");
    expect(runtime.elisionPunctuation).toContain("’");
    expect(COMPOSITION_POLICY_RULE_IDS).toHaveLength(6);
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
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
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
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
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
  it("derives function spacing cells from the selected shared symbols", () => {
    const changedSymbols = SYMBOL_RULES.map((rule) =>
      rule.print === "x" ? { ...rule, braille: "⠿" } : rule);
    const program = compileTechnicalSigns(changedSymbols, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
      TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES,
      TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, {
        ...TECHNICAL_FUNCTION_SPACING_RULES,
        definitions: { letterPrintPattern: "^x$", namePattern: "^[a-m]" },
      });
    expect(program.functionSpacing).toEqual({ letterCells: ["⠿"], namePattern: "^[a-m]" });
  });

  it.each(["letterPrintPattern", "namePattern"] as const)(
    "rejects malformed function spacing %s", (pattern) => {
      expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
        TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
        TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES,
        TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, {
          ...TECHNICAL_FUNCTION_SPACING_RULES,
          definitions: { ...TECHNICAL_FUNCTION_SPACING_RULES.definitions, [pattern]: "(" },
        })).toThrow();
    },
  );

  it("rejects function spacing without an official citation", () => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
      TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES,
      TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, {
        ...TECHNICAL_FUNCTION_SPACING_RULES,
        citation: { ...TECHNICAL_FUNCTION_SPACING_RULES.citation, locator: "" },
      })).toThrow("official ICEB citation");
  });

  it.each(["international", "bana-2026"] as const)(
    "rejects operation spacing without an official %s citation", (jurisdiction) => {
      for (const [field, value] of [["locator", ""], ["url", "https://example.com/"]] as const) {
        const uncited = structuredClone(TECHNICAL_OPERATION_SPACING_RULES);
        Object.defineProperty(uncited[jurisdiction].citation, field, { value });
        expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
          TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
          TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES,
          TECHNICAL_VALUE_PATTERNS, uncited, TECHNICAL_FUNCTION_SPACING_RULES,
        )).toThrow("official");
      }
    },
  );

  it.each(TECHNICAL_VALUE_KINDS)("rejects malformed %s input patterns", (kind) => {
    for (const pattern of ["", "("]) {
      expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
        TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
        TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES,
        { ...TECHNICAL_VALUE_PATTERNS, [kind]: pattern }, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow();
    }
  });

  it.each(TECHNICAL_ARROW_DIRECTIONS)("rejects a missing arrow reference for %s", (direction) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES, {
      ...TECHNICAL_SIGN_MAPPINGS,
      arrows: { ...TECHNICAL_SIGN_MAPPINGS.arrows, [direction]: "missing" },
    }, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES,
    TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("references missing symbol");
  });

  it.each(["", "("])("rejects an invalid item identifier pattern %j", (identifierPattern) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
      TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, {
        ...TECHNICAL_ITEM_RULES,
        definitions: { ...TECHNICAL_ITEM_RULES.definitions, identifierPattern },
      }, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow();
  });

  it("rejects item policy without an official citation", () => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
      TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, {
        ...TECHNICAL_ITEM_RULES,
        citation: { ...TECHNICAL_ITEM_RULES.citation, locator: "" },
      }, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
  });

  it("resolves ordinary and enlarged enclosures through the shared symbols", () => {
    const program = compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES);
    expect(program.delimiters.enclosures.round).toEqual({ open: "⠐⠣", close: "⠐⠜" });
    expect(program.delimiters.matrixEnclosures.determinant).toEqual({ open: "⠠⠸⠳", close: "⠠⠸⠳" });
    const changedSymbols = SYMBOL_RULES.map((rule) =>
      rule.print === "(" ? { ...rule, braille: "⠁⠃" } : rule);
    const changed = compileTechnicalSigns(changedSymbols, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES);
    expect(changed.delimiters.enclosures.round.open).toBe("⠁⠃");
    expect(changed.delimiters.matrixEnclosures.round.open).toBe("⠠⠁⠃");
  });

  it.each([...TECHNICAL_DELIMITER_SIGNS, "enlargedPrefix"] as const)(
    "rejects malformed delimiter cells for %s", (name) => {
      for (const cells of ["", "print"]) {
        expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
          TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, {
            ...TECHNICAL_DELIMITER_RULES,
            definitions: { ...TECHNICAL_DELIMITER_RULES.definitions, [name]: cells },
          }, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("malformed cells");
      }
    },
  );

  it.each(TECHNICAL_ENCLOSURES)("rejects missing %s enclosure symbols", (name) => {
    for (const side of ["open", "close"] as const) {
      expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
        TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, {
          ...TECHNICAL_DELIMITER_RULES,
          definitions: { ...TECHNICAL_DELIMITER_RULES.definitions, enclosures: {
            ...TECHNICAL_DELIMITER_RULES.definitions.enclosures,
            [name]: { ...TECHNICAL_DELIMITER_RULES.definitions.enclosures[name], [side]: "missing" },
          } },
        }, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("references missing symbol");
    }
  });

  it("rejects uncited delimiter definitions", () => {
    const uncited = structuredClone(TECHNICAL_DELIMITER_RULES);
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, uncited, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
  });

  it("emits only additions without copying shared symbol definitions", () => {
    const program = compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES);
    expect(program.symbols).toHaveLength(6);
    expect(program.itemPolicy).toEqual(TECHNICAL_ITEM_RULES.definitions);
    expect(program.valuePatterns).toEqual(TECHNICAL_VALUE_PATTERNS);
    const generalPrints = new Set(SYMBOL_RULES.map((rule) => rule.print));
    expect(program.symbols.some((entry) => generalPrints.has(entry.print))).toBe(false);
    expect(program.shapes).toEqual(TECHNICAL_SHAPE_RULES.definitions);
    expect(program.shapes.fills).not.toBe(TECHNICAL_SHAPE_RULES.definitions.fills);
    expect(program.shapes.names).not.toBe(TECHNICAL_SHAPE_RULES.definitions.names);
  });

  it.each(TECHNICAL_OPERATIONS)("rejects a missing operation reference for %s", (operation) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES, {
      ...TECHNICAL_SIGN_MAPPINGS,
      operations: { ...TECHNICAL_SIGN_MAPPINGS.operations, [operation]: "missing" },
    }, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("references missing symbol");
  });

  it.each(TECHNICAL_COMPARISONS)("rejects a missing comparison reference for %s", (comparison) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES, {
      ...TECHNICAL_SIGN_MAPPINGS,
      comparisons: { ...TECHNICAL_SIGN_MAPPINGS.comparisons, [comparison]: "missing" },
    }, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("references missing symbol");
  });

  it("rejects additions that overwrite general symbol definitions", () => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES,
      [...TECHNICAL_SYMBOL_RULES, symbol("test-duplicate-plus", "+")],
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES,
      TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow(expect.objectContaining({ code: "conflicting-print" }));
  });

  it.each(["", "not-braille"])("rejects malformed script indicator %j", (indicator) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, {
        ...TECHNICAL_SCRIPT_RULES,
        definitions: {
          ...TECHNICAL_SCRIPT_RULES.definitions,
          "left-superscript": { indicator, position: "before" },
        },
      },
      TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("malformed indicator");
  });

  it("rejects script definitions without an official citation", () => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, {
        ...TECHNICAL_SCRIPT_RULES,
        citation: { ...TECHNICAL_SCRIPT_RULES.citation, locator: "" },
      },
      TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
    const uncited = structuredClone(TECHNICAL_SCRIPT_RULES);
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, uncited,
      TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
  });

  it.each(["", "not-braille"])("rejects malformed modifier cells %j", (cells) => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, {
        ...TECHNICAL_MODIFIER_RULES,
        definitions: { ...TECHNICAL_MODIFIER_RULES.definitions, "bar-above": cells },
      }, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("malformed cells");
  });

  it("rejects modifier definitions without an official citation", () => {
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, {
        ...TECHNICAL_MODIFIER_RULES,
        citation: { ...TECHNICAL_MODIFIER_RULES.citation, locator: "" },
      }, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
    const uncited = structuredClone(TECHNICAL_MODIFIER_RULES);
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
    expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
      TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, uncited, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
  });

  it.each(["", "not-braille"])("rejects malformed shape cells %j", (cells) => {
    const definitions = TECHNICAL_SHAPE_RULES.definitions;
    for (const replacement of [
      { ...definitions, fills: { ...definitions.fills, outline: cells } },
      { ...definitions, names: { ...definitions.names, circle: cells } },
      { ...definitions, terminator: cells },
    ]) {
      expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
        TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES,
        { ...TECHNICAL_SHAPE_RULES, definitions: replacement }, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("malformed cells");
    }
  });

  it("rejects shape definitions without an official citation", () => {
    const uncited = structuredClone(TECHNICAL_SHAPE_RULES);
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
    for (const source of [uncited, {
      ...TECHNICAL_SHAPE_RULES,
      citation: { ...TECHNICAL_SHAPE_RULES.citation, locator: "" },
    }]) {
      expect(() => compileTechnicalSigns(SYMBOL_RULES, TECHNICAL_SYMBOL_RULES,
        TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES, TECHNICAL_MODIFIER_RULES, source, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_FUNCTION_SPACING_RULES)).toThrow("official ICEB citation");
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
    Object.defineProperty(uncited.citation, "url", { value: "https://example.com/" });
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
