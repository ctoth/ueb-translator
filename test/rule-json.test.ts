import { describe, expect, it } from "vitest";
import * as readers from "../rules/ueb-2024/rule-json.js";
import { SYMBOL_RULES } from "../rules/ueb-2024/symbols/source.js";
import { expandSources, expansionTable } from "../rules/ueb-2024/expansion.js";
import { GRADE2_CONTEXTUAL_RULES } from "../rules/ueb-2024/program.js";
import type { ContextualRuleGuard } from "../rules/ueb-2024/contextual-compiler.js";
import { guardText, guardWords, readEngineSchema, readGuard } from "../rules/ueb-2024/contextual-engine.js";
import { officialDocuments, routedSources } from "../rules/ueb-2024/source-manifest.js";
import { citeIceb } from "../rules/ueb-2024/source.js";
import modeData from "../rules/ueb-2024/modes/rules.json" with { type: "json" };
import specialData from "../rules/ueb-2024/symbols/special.json" with { type: "json" };
import groupData from "../rules/ueb-2024/grade2-rules.json" with { type: "json" };
import scriptData from "../rules/ueb-2024/technical-script-rules.json" with { type: "json" };
import constraintData from "../rules/ueb-2024/constraints.json" with { type: "json" };
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
function isRow(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const expandedRow: unknown = expansionTable("grade2Rules")[0];
if (!isRow(expandedRow)) throw new Error("Expanded rule fixture missing.");
const expandedRule = expandedRow;

describe("JSON rule source decoding", () => {
  it("takes expansion precedence, citations and provenance IDs from policy data", () => {
    const changed = expandSources({ expansion: { ...expansionData, shortformPrecedence: 8,
      ids: { ...expansionData.ids, shortformPrefix: "selected-", contractionPrefix: "selected-" } } });
    expect(readers.readExpandedShortform(changed["shortforms"]?.[0]).id).toBe("selected-about");
    expect(readers.readExpandedGrade2Rule(changed["grade2Rules"]?.[0]).id).toMatch(/^selected-/u);
    expect((changed["rules"] ?? []).map(readers.readExpandedContextualRule)
      .find((rule) => rule.id === "selected-about")?.precedence).toBe(8);
    const malformed = expandSources({ expansion: { ...expansionData, shortformPrecedence: true } });
    expect(() => (malformed["rules"] ?? []).map(readers.readExpandedContextualRule)).toThrow();
  });
  it("routes nested sources by the shared manifest", () => {
    expect(sourceData("modes")).toBe(modeData);
    expect(sourceData("technical", "inputs", "scripts")).toBe(scriptData);
    expect(assembleSources({ renamed: { letters: "symbols/special.json" } }, sourceFile))
      .toEqual({ renamed: { letters: specialData } });
    expect(() => sourceData("missing")).toThrow("Unknown rule source");
    expect(() => sourceFile("missing.json")).toThrow("Unknown rule source file");
    expect(() => assembleSources({ invalid: 4 }, sourceFile)).toThrow("Expected a source group");
  });

  it("keeps every citation document at its authority's official host", () => {
    const hosts = { ICEB: "https://iceb.org/", BANA: "https://brailleauthority.org/" };
    const documents = { book: { authority: "BANA", document: "Book", url: "https://brailleauthority.org/node/1" } };
    expect(officialDocuments(documents, hosts)).toBe(documents);
    for (const url of ["https://iceb.org/publications/", "https://example.com/", 1]) {
      expect(() => officialDocuments({ book: { ...documents.book, url } }, hosts)).toThrow("official host");
    }
    expect(() => officialDocuments({ book: { ...documents.book, authority: "Other" } }, hosts)).toThrow("official host");
    expect(() => officialDocuments(documents, { BANA: 1 })).toThrow("official host");
    expect(() => officialDocuments(documents, [])).toThrow("citation authorities to be a record");
    expect(() => officialDocuments([], hosts)).toThrow("citation documents to be a record");
    expect(() => officialDocuments({ book: "Book" }, hosts)).toThrow("citation document book to be a record");
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
  it.each(["", " ", 1])("rejects malformed citation locator %j", locator => {
    expect(() => readers.readModeRules([{ ...mode, citation: { ...mode.citation, locator } }])).toThrow();
  });
  it("strips runtime fact citations and rejects uncited or empty groups", () => {
    const citation = { source: "ueb-2024", locator: "4.3" };
    expect(readers.readRuntimeFacts({ ligature: { citation, indicator: "⠘⠖", list: ["a"], map: { b: "c" } } }))
      .toEqual({ ligature: { indicator: "⠘⠖", list: ["a"], map: { b: "c" } } });
    expect(() => readers.readRuntimeFacts({ ligature: { citation } })).toThrow("empty");
    expect(() => readers.readRuntimeFacts({ ligature: { indicator: "⠘⠖" } })).toThrow();
    expect(() => readers.readRuntimeFacts({ ligature: { citation, indicator: 1 } })).toThrow();
  });
  it("rejects a rule group whose kind has no family", () => {
    expect(() => expandSources({ families: {} })).toThrow("no match");
  });
  it("rejects an empty locator at the citation boundary", () => {
    expect(() => citeIceb(" ")).toThrow("Malformed citation");
  });
  it.each(["missing", 1])("rejects unknown citation document reference %s", source => {
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
    const expandedGroup = (guards: readonly unknown[]): readonly ContextualRuleGuard[] =>
      readers.readExpandedGrade2Rule(expandSources({ groups: [{ ...group, guards }, ...groupData.slice(1)] })["grade2Rules"]?.[0]).guards;
    expect(expandedGroup(guards)).toEqual(expect.arrayContaining([...guards]));
    const boundaryGuard: ContextualRuleGuard = { kind: "not-crossing", boundaries: ["braille-line", "compound", "prefix", "suffix", "syllable"] };
    expect(expandedGroup([boundaryGuard])).toContainEqual(boundaryGuard);
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
    expect(() => readers.readExpandedGrade2Rule({ ...expandedRule, guards: [guard] })).toThrow();
  });
  it("rejects a malformed contextual engine schema", () => {
    for (const schema of [null, { boundaries: "x", guards: {} },
      { boundaries: {}, guards: { "word-end": { opcode: 0, operands: "x" } } }]) {
      expect(() => readEngineSchema(schema)).toThrow("Malformed contextual engine schema.");
    }
  });
  it("rejects malformed contextual guards", () => {
    expect(guardText(readGuard({ kind: "previous-not", characters: "a" }), "characters")).toBe("a");
    expect(() => readGuard(null)).toThrow("Malformed contextual guard.");
    expect(() => readGuard({ kind: "word-end", extra: "x" })).toThrow("Unexpected field in word-end guard.");
    expect(() => readGuard({ kind: "previous-not", characters: ["a"] })).toThrow("must be text");
    expect(() => readGuard({ kind: "not-word-ending", endings: "ing" })).toThrow("must be a list");
  });
  it("keeps routed sources beside documents and symbols", () => {
    expect(() => routedSources({ documents: "x" })).toThrow("Routed sources cannot replace");
    expect(() => routedSources({ symbols: "x" })).toThrow("Routed sources cannot replace");
  });
  it("resolves targeted guards and their citation", () => {
    const constraint = readers.readExpandedConstraint(expandSources()["constraints"]?.[0]);
    expect(constraint).toMatchObject({
      target: { kind: "strong-contraction", print: "of" },
      citation: { authority: "ICEB", locator: "10.3.1" },
      guards: [{ kind: "not-word", ignoredCharacters: "-" }],
    });
    const [guard] = constraint.guards;
    expect(guard === undefined ? [] : guardWords(guard, "words")).toEqual(
      expect.arrayContaining(["microfilms", "microfilm's"]));
  });
  it.each([
    { kind: "missing", print: "of" }, { kind: "strong-contraction", print: "missing" },
  ])("rejects unknown constraint target %j", target => {
    expect(() => expandSources({ constraints: [{ ...constraintData[0], target }] })).toThrow("no match");
  });
  it.each([
    { idSuffix: "extra", locator: "", precedence: 4, guards: [] },
    { idSuffix: "extra", locator: "10.10", precedence: 10, guards: [] },
    { idSuffix: "extra", locator: "10.10", precedence: 4, guards: [{ kind: "unknown" }] },
  ])("rejects malformed explicit variant %j", variant => {
    expect(() => readers.readExpandedGrade2Rule({ ...expandedRule, variants: [variant] })).toThrow();
  });
  it.each([
    { kind: "not-word", words: [{ base: "microfilm", suffixes: [2] }], possessives: true, ignoredCharacters: "-" },
    { kind: "not-word", words: ["of"], possessives: "yes", ignoredCharacters: "-" },
    { kind: "not-word-ending", endings: [2] },
    { kind: "unknown" },
  ])("rejects malformed targeted guard %j", guard => {
    expect(() => (expandSources({ constraints: [{ ...constraintData[0], guards: [guard] }] })["constraints"] ?? [])
      .map(readers.readExpandedConstraint)).toThrow();
  });
});
