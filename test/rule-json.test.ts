import { describe, expect, it } from "vitest";
import * as readers from "../rules/ueb-2024/rule-json.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import { GRADE2_RULE_KINDS, GRADE2_RULE_LOCATOR_BY_KIND } from "../rules/ueb-2024/grade2-rules.js";
import { GRADE2_CONTEXTUAL_RULES } from "../rules/ueb-2024/program.js";
import type { ContextualRuleGuard } from "../rules/ueb-2024/contextual-compiler.js";
import modeData from "../rules/ueb-2024/modes/rules.json" with { type: "json" };
import groupData from "../rules/ueb-2024/grade2-rules.json" with { type: "json" };
import compoundData from "../rules/ueb-2024/compound-exceptions.json" with { type: "json" };
import syllableData from "../rules/ueb-2024/syllable-exceptions.json" with { type: "json" };
import initialData from "../rules/ueb-2024/initial-exceptions.json" with { type: "json" };
import finalData from "../rules/ueb-2024/final-exceptions.json" with { type: "json" };
import scriptData from "../rules/ueb-2024/technical-script-rules.json" with { type: "json" };
import delimiterData from "../rules/ueb-2024/technical-delimiter-rules.json" with { type: "json" };
import valuePatterns from "../rules/ueb-2024/technical-value-patterns.json" with { type: "json" };
import spacingData from "../rules/ueb-2024/technical-operation-spacing-rules.json" with { type: "json" };
import inventoryData from "../rules/ueb-2024/inventory.json" with { type: "json" };

const mode = modeData[0];
if (mode === undefined) throw new Error("Mode fixture missing.");
const symbol = SYMBOL_RULES[0];
if (symbol === undefined) throw new Error("Symbol fixture missing.");
const group = groupData[0];
if (group === undefined) throw new Error("Contraction fixture missing.");

describe("JSON rule source decoding", () => {
  it("reads derived digit metadata and null/uppercase symbol fields", () => {
    expect(readers.readSymbolRules(SYMBOL_RULES).filter(rule => rule.kind === "digit")
      .map(rule => rule.numericDigit)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
  });

  it.each([null, 1, [], { words: [] }])("rejects non-record rule %j", value => {
    expect(() => readers.readSymbolRules([value])).toThrow();
  });
  it.each([null, {}, [1]])("rejects malformed string list %j", value => {
    expect(() => readers.readStrings(value)).toThrow();
  });
  it.each([{}, [[]], [["x"]], [[1, "⠭"]], [["x", 1]]])("rejects malformed print/cell pairs %j", value => {
    expect(() => readers.readPairs(value)).toThrow();
  });
  it.each(["three", Infinity, NaN])("rejects non-finite/non-number inventory value %j", value => {
    expect(() => readers.readInventory({ ...inventoryData, rules: value })).toThrow("finite JSON number");
  });
  it("rejects a mode name outside its retained TypeScript domain", () => {
    expect(() => readers.readModeRules([{ ...mode, name: "unknown-mode" }])).toThrow("Unexpected JSON member");
  });
  it.each(["missing", 1])("rejects malformed citation locator %j", locator => {
    expect(() => readers.readModeRules([{ ...mode, citation: { ...mode.citation, locator } }])).toThrow();
  });
  it.each(["authority", "document", "url"])("rejects changed ICEB citation %s", field => {
    expect(() => readers.readModeRules([{ ...mode, citation: { ...mode.citation, [field]: "invalid" } }])).toThrow("ICEB citation");
  });
  it("rejects malformed nullable symbol fields", () => {
    expect(() => readers.readSymbolRules([{ ...symbol, numericDigit: 2 }])).toThrow("JSON string");
    expect(() => readers.readSymbolRules([{ ...symbol, uppercasePrint: false }])).toThrow("JSON string");
  });
  it("preserves the full guard contract, including compiler-derived variants", () => {
    const guards: readonly ContextualRuleGuard[] = [
      ...GRADE2_CONTEXTUAL_RULES.flatMap(rule => rule.guards),
      { kind: "not-word-ending", endings: ["ing"] },
    ];
    for (const guard of guards) {
      expect(readers.readGrade2Rules([{ ...group, guards: [guard] }], GRADE2_RULE_KINDS,
        GRADE2_RULE_LOCATOR_BY_KIND)[0]?.guards).toEqual([guard]);
    }
    expect(readers.readStructuralGuard({ kind: "not-crossing", boundaries: ["braille-line", "compound", "prefix", "suffix", "syllable"] }).boundaries).toHaveLength(5);
  });
  it.each([
    { kind: "unknown" }, { kind: "previous-not", characters: 2 },
    { kind: "eligibility-word", pluralSuffix: 2, word: "word" },
    { kind: "eligibility-word", pluralSuffix: "s", word: 2 },
    { kind: "following-not-vowel-y-except-words", characters: 2, words: [] },
    { kind: "following-not-vowel-y-except-words", characters: "aeiouy", words: [2] },
    { kind: "lower-sign", policy: "invalid" }, { kind: "not-boundary", boundary: "missing" },
    { kind: "not-boundary", boundary: 2 }, { kind: "not-crossing", boundaries: ["missing"] },
    { kind: "not-word", ignoredCharacters: 2, words: [] },
    { kind: "not-word", ignoredCharacters: "-", words: [2] },
    { kind: "not-standing-match", pattern: 2 }, { kind: "not-word-ending", endings: [2] },
    { kind: "word-with-affixes", affixes: [2] },
  ])("rejects malformed authored contraction guard %j", guard => {
    expect(() => readers.readGrade2Rules([{ ...group, guards: [guard] }], GRADE2_RULE_KINDS, GRADE2_RULE_LOCATOR_BY_KIND)).toThrow();
  });
  it("rejects non-string values and missing keys in closed maps", () => {
    expect(() => readers.readTechnicalValuePatterns({})).toThrow();
    expect(() => readers.readTechnicalValuePatterns({ ...valuePatterns, number: 1 })).toThrow();
    expect(() => readers.readTechnicalOperationSpacingRules({ ...spacingData,
      international: { ...spacingData.international, definitions: { spaced: 1, unspaced: false } },
    })).toThrow();
  });
  it.each([{ indicator: 2, position: "before" }, { indicator: "⠢", position: "sideways" }])("rejects malformed script descriptor %j", descriptor => {
    expect(() => readers.readTechnicalScriptRules({ ...scriptData,
      definitions: { ...scriptData.definitions, "left-subscript": descriptor },
    })).toThrow();
  });
  it.each([{ open: false, close: "|" }, { open: "|", close: false }])("rejects malformed enclosure %j", descriptor => {
    expect(() => readers.readTechnicalDelimiterRules({ ...delimiterData,
      definitions: { ...delimiterData.definitions, enclosures: { ...delimiterData.definitions.enclosures, absolute: descriptor } },
    })).toThrow();
  });
  it("rejects an unknown matrix enclosure reference", () => {
    expect(() => readers.readTechnicalDelimiterRules({ ...delimiterData,
      definitions: { ...delimiterData.definitions, matrixEnclosures: { ...delimiterData.definitions.matrixEnclosures, round: "missing" } },
    })).toThrow();
  });
  it("rejects inconsistent exception identifiers in each family", () => {
    const sources: readonly (readonly [(value: unknown) => unknown, unknown])[] = [
      [readers.readCompoundExceptions, compoundData[0]], [readers.readSyllableExceptions, syllableData[0]],
      [readers.readInitialExceptions, initialData[0]], [readers.readFinalExceptions, finalData[0]],
    ];
    for (const [read, value] of sources) {
      if (typeof value !== "object" || value === null) throw new Error("Exception fixture missing.");
      expect(() => read([{ ...value, id: "wrong-id" }])).toThrow("exception id");
    }
  });
  it("rejects malformed compact exception families", () => {
    expect(() => readers.readCompoundExceptions([{ ...compoundData[0], words: [{ base: "microfilm", suffixes: [2] }] }])).toThrow();
  });
});
