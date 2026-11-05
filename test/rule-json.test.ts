import { describe, expect, it } from "vitest";
import * as readers from "../rules/ueb-2024/rule-json.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import { GRADE2_RULE_KINDS, GRADE2_RULE_FAMILIES } from "../rules/ueb-2024/grade2-rules.js";
import { GRADE2_CONTEXTUAL_RULES } from "../rules/ueb-2024/program.js";
import type { ContextualRuleGuard } from "../rules/ueb-2024/contextual-compiler.js";
import modeData from "../rules/ueb-2024/modes/rules.json" with { type: "json" };
import specialData from "../rules/ueb-2024/symbols/special.json" with { type: "json" };
import groupData from "../rules/ueb-2024/grade2-rules.json" with { type: "json" };
import scriptData from "../rules/ueb-2024/technical-script-rules.json" with { type: "json" };
import delimiterData from "../rules/ueb-2024/technical-delimiter-rules.json" with { type: "json" };
import valuePatterns from "../rules/ueb-2024/technical-value-patterns.json" with { type: "json" };
import spacingData from "../rules/ueb-2024/technical-operation-spacing-rules.json" with { type: "json" };
import constraintData from "../rules/ueb-2024/constraints.json" with { type: "json" };
import { GRADE2_RULES } from "../rules/ueb-2024/grade2-rules.js";
import inventoryData from "../rules/ueb-2024/inventory.json" with { type: "json" };
import { assembleSources, sourceData, sourceFile, SYMBOL_FAMILY_DATA } from "../rules/ueb-2024/source-manifest.js";
import { expandSymbolSources } from "../rules/ueb-2024/symbols/compiler.js";
import expansionData from "../rules/ueb-2024/expansion-policy.json" with { type: "json" };

const mode = modeData[0];
if (mode === undefined) throw new Error("Mode fixture missing.");
const symbol = specialData[0];
if (symbol === undefined) throw new Error("Symbol fixture missing.");
const group = groupData[0];
if (group === undefined) throw new Error("Contraction fixture missing.");

describe("JSON rule source decoding", () => {
  it("takes expansion precedence, citations and provenance IDs from policy data", () => {
    const policy = readers.readExpansionPolicy(expansionData);
    const changed = { ...policy, shortformPrecedence: 8 as const,
      ids: { ...policy.ids, shortformPrefix: "selected-", contractionPrefix: "selected-" } };
    expect(readers.readShortforms([["about", "⠁⠃"]], changed)[0]?.id).toBe("selected-about");
    expect(readers.readGrade2Rules([group], GRADE2_RULE_KINDS, GRADE2_RULE_FAMILIES, changed)[0]?.id)
      .toMatch(/^selected-/u);
    expect(() => readers.readExpansionPolicy({ ...expansionData, shortformPrecedence: true })).toThrow();
  });
  it("routes nested sources by the shared manifest", () => {
    expect(sourceData("modes")).toBe(modeData);
    expect(sourceData("technical", "scripts")).toBe(scriptData);
    expect(assembleSources({ renamed: { letters: "symbols/special.json" } }, sourceFile))
      .toEqual({ renamed: { letters: specialData } });
    expect(() => sourceData("missing")).toThrow("Unknown rule source");
    expect(() => sourceFile("missing.json")).toThrow("Unknown rule source file");
    expect(() => assembleSources({ invalid: 4 }, sourceFile)).toThrow("Expected a source group");
  });

  it("takes family order and derived symbol metadata from descriptors", () => {
    const families = readers.readSymbolFamilies(SYMBOL_FAMILY_DATA);
    const blocks = families.map(family => expandSymbolSources([family], sourceFile));
    expect(expandSymbolSources([...families].reverse(), sourceFile))
      .toEqual(blocks.reverse().flat());
    const family = families.find(entry => entry.kind === "pairs");
    if (family?.kind !== "pairs") throw new Error("Missing pair family.");
    const changed = expandSymbolSources([{ ...family, idPrefix: "selected-", uppercase: false,
      idKey: "utf16-hex", citation: { source: "ueb-2024", locator: "Symbols list: U+{utf16Hex4}" },
    }], () => [["😀", "⠁"]]);
    expect(changed[0]).toMatchObject({ id: "selected-d83d", uppercasePrint: null,
      citation: { locator: "Symbols list: U+D83D" } });
    const digits = families.find(entry => entry.kind === "digits");
    if (digits?.kind !== "digits") throw new Error("Missing digit family.");
    expect(expandSymbolSources([{ ...digits, prints: ["0", "7"] }], () => [["a", "⠁"], ["b", "⠃"]])
      .map(entry => [entry.print, entry.numericDigit, entry.braille]))
      .toEqual([["0", "0", "⠁"], ["7", "7", "⠃"]]);
    expect(() => expandSymbolSources([digits], () => [])).toThrow("exceeds");
  });

  it.each([{}, { kind: "missing", file: "x" }, { kind: "pairs", file: 1 }])(
    "rejects malformed symbol family %j", family => {
      expect(() => readers.readSymbolFamilies([family])).toThrow();
    },
  );

  it("reads derived digit metadata and null/uppercase symbol fields", () => {
    expect(SYMBOL_RULES.filter(rule => rule.kind === "digit")
      .map(rule => rule.numericDigit)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
    expect(readers.readSymbolRules(specialData)[0]).toMatchObject({ numericDigit: null, uppercasePrint: "Ŋ" });
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
  it.each(["technical-2014", "missing"])("rejects incorrect citation document reference %s", source => {
    expect(() => readers.readModeRules([{ ...mode, citation: { ...mode.citation, source } }])).toThrow();
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
        GRADE2_RULE_FAMILIES)[0]?.guards).toContainEqual(guard);
    }
    const boundaryGuard: ContextualRuleGuard = { kind: "not-crossing", boundaries: ["braille-line", "compound", "prefix", "suffix", "syllable"] };
    expect(readers.readGrade2Rules([{ ...group, guards: [boundaryGuard] }], GRADE2_RULE_KINDS,
      GRADE2_RULE_FAMILIES)[0]?.guards).toContainEqual(boundaryGuard);
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
    expect(() => readers.readGrade2Rules([{ ...group, guards: [guard] }], GRADE2_RULE_KINDS, GRADE2_RULE_FAMILIES)).toThrow();
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
  it("resolves targeted guards and their citation", () => {
    expect(readers.readConstraints(constraintData, GRADE2_RULES)[0]).toMatchObject({
      target: { kind: "strong-contraction", print: "of" },
      citation: { authority: "ICEB", locator: "10.3.1" },
      guards: [{ kind: "not-word", ignoredCharacters: "-", words: expect.arrayContaining(["microfilms", "microfilm's"]) }],
    });
  });
  it.each([
    { kind: "missing", print: "of" }, { kind: "strong-contraction", print: "missing" },
  ])("rejects unknown constraint target %j", target => {
    expect(() => readers.readConstraints([{ ...constraintData[0], target }], GRADE2_RULES)).toThrow("target");
  });
  it.each([
    { idSuffix: "extra", locator: "missing", precedence: 4, guards: [] },
    { idSuffix: "extra", locator: "10.10", precedence: 10, guards: [] },
    { idSuffix: "extra", locator: "10.10", precedence: 4, guards: [{ kind: "unknown" }] },
  ])("rejects malformed explicit variant %j", variant => {
    expect(() => readers.readGrade2Rules([{ ...group, variants: [variant] }], GRADE2_RULE_KINDS,
      GRADE2_RULE_FAMILIES)).toThrow();
  });
  it.each([
    { kind: "not-word", words: [{ base: "microfilm", suffixes: [2] }], possessives: true, ignoredCharacters: "-" },
    { kind: "not-word", words: ["of"], possessives: "yes", ignoredCharacters: "-" },
    { kind: "not-word-ending", endings: [2] },
    { kind: "unknown" },
  ])("rejects malformed targeted guard %j", guard => {
    expect(() => readers.readConstraints([{ ...constraintData[0], guards: [guard] }], GRADE2_RULES)).toThrow();
  });
});
