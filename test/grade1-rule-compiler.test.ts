import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  GRADE1_MODE_COMPILATION,
  GRADE1_SYMBOL_COMPILATION,
} from "../rules/ueb-2024/grade1-program.js";
import {
  GRADE1_MODE_RULE_IDS,
  GRADE1_SYMBOL_RULE_IDS,
} from "../src/generated/grade1-provenance.js";
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
import {
  indicatorKind,
  modeIndicator,
  scanModeSpan,
  type ModeProgram,
} from "../src/mode-engine.js";

const engineSource = readFileSync(
  new URL("../src/mode-engine.ts", import.meta.url),
  "utf8",
);
const runtimeSource = readFileSync(
  new URL("../src/grade1-runtime.ts", import.meta.url),
  "utf8",
);

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

  it("keeps UEB vocabulary out of the generic interpreter", () => {
    expect(engineSource).not.toMatch(
      /capitals|grade1-required|numeric-ambiguous|typeform|uppercase-letter/u,
    );
  });

  it("routes mode transitions without the former recursive state machine", () => {
    expect(runtimeSource).toContain("resolveModes(");
    expect(runtimeSource).not.toMatch(/numericMode|capitalsPassageEnd|units\.slice\(/u);
    expect(runtimeSource.match(/translateUnits\(/gu)).toHaveLength(2);
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
