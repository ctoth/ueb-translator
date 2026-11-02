/** JSON source decoding. Rule semantics are validated by the existing compilers. */
import { citeIceb, type IcebRuleCitation, type IcebRuleLocator, type RuleCitation } from "./source.js";
import type { SymbolRuleSource } from "./symbols/compiler.js";
import { MODE_NAMES, MEMBER_CLASSES, type ModeRuleSource } from "./modes/compiler.js";
import { POLICY_NAMES, type CompositionPolicySource } from "./policies/compiler.js";
import type { Grade2RuleKind, Grade2RuleLocatorByKind, Grade2RuleSource, Grade2RuleSourceFor, Grade2RuleGroupSource } from "./grade2-rules.js";
import type { Appendix1Base, Appendix1WordSource, Appendix1GroupSource } from "./appendix1.js";
import type { ShortformSource } from "./shortforms.js";
import type {
  CompoundContractionExceptionSource, FirstSyllableContractionExceptionSource,
  FirstSyllableVowelWordsSource, InitialContractionExceptionSource, FinalGroupsignExceptionSource,
  WordFamilySource,
} from "./constraints.js";
import { BOUNDARY_BITS, type ContextualRuleGuard } from "./contextual-compiler.js";
import type { ContextualBoundaryKind } from "../../src/contextual-transducer.js";
import type {
  TechnicalScriptSource, TechnicalDelimiterSource, TechnicalModifierSource, TechnicalShapeSource,
  TechnicalItemSource, TechnicalOperationSpacingSource, TechnicalGrade1ProtectionSource,
  TechnicalFunctionSpacingSource, TechnicalNumericContinuationSource, TechnicalComputerWhitespaceSource,
} from "./technical-signs.js";
import {
  TECHNICAL_OPERATIONS, TECHNICAL_COMPARISONS, TECHNICAL_ARROW_DIRECTIONS,
  TECHNICAL_SCRIPT_PLACEMENTS, TECHNICAL_MODIFIERS, TECHNICAL_SHAPE_NAMES, TECHNICAL_SHAPE_FILLS,
  TECHNICAL_ITEM_KINDS, TECHNICAL_VALUE_KINDS, TECHNICAL_ENCLOSURES, TECHNICAL_MATRIX_ENCLOSURES,
  type TechnicalSignProgram,
} from "../../src/technical-program.js";
import { CONTEXTUAL_PRECEDENCES } from "../../src/contextual-schema.js";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function record(value: unknown): Readonly<Record<string, unknown>> { return checked(value, isRecord); }
function array(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error("Expected JSON array.");
  return value;
}
function string(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected JSON string.");
  return value;
}
function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Expected finite JSON number.");
  return value;
}
function member<const T extends string | number>(value: unknown, choices: readonly T[]): T {
  const found = choices.find(choice => choice === value);
  if (found === undefined) throw new Error(`Unexpected JSON member: ${String(value)}`);
  return found;
}
function checked<T>(value: unknown, predicate: (value: unknown) => value is T): T {
  if (!predicate(value)) throw new Error("Malformed JSON rule source.");
  return value;
}
function isString(value: unknown): value is string { return typeof value === "string"; }
function isBoolean(value: unknown): value is boolean { return typeof value === "boolean"; }
function isStrings(value: unknown): value is readonly string[] { return Array.isArray(value) && value.every(isString); }
function mapOf<K extends string, T>(value: unknown, keys: readonly K[], predicate: (entry: unknown) => entry is T): Readonly<Record<K, T>> {
  return checked(value, (candidate): candidate is Readonly<Record<K, T>> => {
    const entries = record(candidate);
    return Object.keys(entries).length === keys.length && keys.every(key => predicate(entries[key]));
  });
}
function isLocator(value: unknown): value is IcebRuleLocator {
  return typeof value === "string" && (value.startsWith("Symbols list: U+") ||
    ["2.6", "3", "4.1.1", "4.2.1", "4.3", "4.4.1", "4.5.1", "4.6.1", "5", "6.1.1", "6.1-6.5", "7", "8.3-8.6", "9.2-9.4",
      "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9 and Appendix 1",
      "10.3.1", "10.6.1", "10.10", "10.7.2", "10.7.3", "10.7.4", "10.7.5", "10.7.6", "10.7.7", "10.7.8", "10.7.9", "10.8.3", "10.8.4"].includes(value));
}
function iceb<L extends IcebRuleLocator>(value: unknown, locator: L): IcebRuleCitation<L> {
  const source = record(value), expected = citeIceb(locator);
  if (Object.entries(expected).some(([key, entry]) => source[key] !== entry)) throw new Error("Malformed JSON ICEB citation.");
  return expected;
}
function generalCitation(value: unknown): IcebRuleCitation {
  return iceb(value, checked(record(value)["locator"], isLocator));
}
export function readStrings(value: unknown): readonly string[] { return checked(value, isStrings); }
export function readStructuralGuard(value: unknown): Extract<ContextualRuleGuard, { readonly kind: "not-crossing" }> {
  const source = record(value);
  return { kind: member(source["kind"], ["not-crossing"]),
    boundaries: array(source["boundaries"]).map(value => checked(value, isBoundary)) };
}
export function readPairs(value: unknown): readonly (readonly [string, string])[] {
  return array(value).map(entry => {
    const pair = array(entry);
    if (pair.length !== 2) throw new Error("Expected print/cell pair.");
    return [string(pair[0]), string(pair[1])];
  });
}
export function readSymbolRules(value: unknown): readonly SymbolRuleSource[] {
  return array(value).map(entry => {
    const source = record(entry), citation = record(source["citation"]);
    const readCitation = (): SymbolRuleSource["citation"] => {
      if (citation["document"] === "Rules of Unified English Braille, Third Edition (2024)") return generalCitation(citation);
      return {
        authority: member(citation["authority"], ["ICEB"]),
        document: member(citation["document"], ["Guidelines for Technical Material: Section 3, Signs of Operation and Comparison (2018)"]),
        locator: member(citation["locator"], ["Operation signs table, p. 1", "Comparison signs table, p. 1", "Comparison signs table, p. 2"]),
        url: member(citation["url"], ["https://iceb.org/publications/ueb/"]),
      };
    };
    return { braille: string(source["braille"]), citation: readCitation(), id: string(source["id"]),
      kind: member(source["kind"], ["digit", "letter", "modifier", "symbol"]),
      numericDigit: source["numericDigit"] === null ? null : string(source["numericDigit"]),
      print: string(source["print"]), uppercasePrint: source["uppercasePrint"] === null ? null : string(source["uppercasePrint"]) };
  });
}
export function readModeRules(value: unknown): readonly ModeRuleSource[] {
  return array(value).map(entry => {
    const source = record(entry), definition = record(source["definition"]);
    return { citation: generalCitation(source["citation"]), id: string(source["id"]), name: member(source["name"], MODE_NAMES),
      definition: { continuesThrough: array(definition["continuesThrough"]).map(entry => member(entry, MEMBER_CLASSES)),
        indicators: mapOf(definition["indicators"], ["passage", "symbol", "terminator", "word"], isString),
        memberClass: member(definition["memberClass"], MEMBER_CLASSES), passageThreshold: number(definition["passageThreshold"]),
        terminatedBy: array(definition["terminatedBy"]).map(entry => member(entry, MEMBER_CLASSES)) } };
  });
}
export function readCompositionRules(value: unknown): readonly CompositionPolicySource[] {
  return array(value).map(entry => { const source = record(entry); return {
    citation: generalCitation(source["citation"]), id: string(source["id"]), members: readStrings(source["members"]), name: member(source["name"], POLICY_NAMES),
  }; });
}
function isBoundary(value: unknown): value is ContextualBoundaryKind {
  return typeof value === "string" && Object.hasOwn(BOUNDARY_BITS, value);
}
function isGuard(value: unknown): value is ContextualRuleGuard {
  const source = record(value);
  switch (source["kind"]) {
    case "stable-following-modes": case "stable-adjacent-modes": case "first-syllable": case "not-word-end":
    case "not-word-start": case "not-whole-word": case "preceded-by-letter": case "standing-alone":
    case "word-end": case "word-internal": case "word-start": return true;
    case "eligibility-word": return isString(source["pluralSuffix"]) && isString(source["word"]);
    case "following": case "following-not-vowel-y": case "previous-not": return isString(source["characters"]);
    case "following-not-vowel-y-except-words": return isString(source["characters"]) && isStrings(source["words"]);
    case "lower-sign": return source["policy"] === "enough-or-in" || source["policy"] === "other";
    case "not-boundary": return isBoundary(source["boundary"]);
    case "not-crossing": return array(source["boundaries"]).every(isBoundary);
    case "not-word": case "not-standing-word": return isString(source["ignoredCharacters"]) && isStrings(source["words"]);
    case "not-standing-match": return isString(source["pattern"]);
    case "not-word-ending": return isStrings(source["endings"]);
    case "word-with-affixes": return isStrings(source["affixes"]);
    default: return false;
  }
}
export function readGrade2Locators(value: unknown): Grade2RuleLocatorByKind {
  const source = record(value);
  return {
    "alphabetic-wordsign": member(source["alphabetic-wordsign"], ["10.1"]),
    "final-letter-groupsign": member(source["final-letter-groupsign"], ["10.8"]),
    "initial-letter-contraction": member(source["initial-letter-contraction"], ["10.7"]),
    "lower-groupsign": member(source["lower-groupsign"], ["10.6"]),
    "lower-wordsign": member(source["lower-wordsign"], ["10.5"]),
    "strong-contraction": member(source["strong-contraction"], ["10.3"]),
    "strong-groupsign": member(source["strong-groupsign"], ["10.4"]),
    "strong-wordsign": member(source["strong-wordsign"], ["10.2"]),
  };
}
export function readGrade2Rules(value: unknown, kinds: readonly Grade2RuleKind[], locators: Grade2RuleLocatorByKind): readonly Grade2RuleSource[] {
  return array(value).flatMap<Grade2RuleSource>(entry => {
    const source = record(entry);
    const group: Grade2RuleGroupSource = { kind: member(source["kind"], kinds),
      guards: array(source["guards"]).map(guard => checked(guard, isGuard)),
      precedence: member(source["precedence"], CONTEXTUAL_PRECEDENCES), entries: readPairs(source["entries"]) };
    const { kind, guards, precedence, entries: pairs } = group;
    function expand<K extends Grade2RuleKind>(selected: K): readonly Grade2RuleSourceFor<K>[] {
      const selectedLocator = locators[selected];
      return pairs.map(([print, braille]) => ({ braille, citation: citeIceb(selectedLocator),
        id: `UEB-${selectedLocator}-${print}`, kind: selected, print, guards, precedence }));
    }
    switch (kind) {
      case "alphabetic-wordsign": return expand(kind);
      case "final-letter-groupsign": return expand(kind);
      case "initial-letter-contraction": return expand(kind);
      case "lower-groupsign": return expand(kind);
      case "lower-wordsign": return expand(kind);
      case "strong-contraction": return expand(kind);
      case "strong-groupsign": return expand(kind);
      case "strong-wordsign": return expand(kind);
    }
  });
}
export function readShortforms(value: unknown): readonly ShortformSource[] {
  return readPairs(value).map(([print, braille]) => ({
    braille, citation: citeIceb("10.9 and Appendix 1"), id: `UEB-10.9-${print}`, print,
  }));
}
export function readAppendixRules(value: unknown, bases: readonly Appendix1Base[]): readonly Appendix1WordSource[] {
  return array(value).flatMap(entry => {
    const source = record(entry);
    const group: Appendix1GroupSource = { base: member(source["base"], bases), words: readStrings(source["words"]) };
    return group.words.map(print => ({
      base: group.base, citation: citeIceb("10.9 and Appendix 1"), id: `UEB-Appendix-1-${group.base}-${print}`, print,
    }));
  });
}
function readWords(value: unknown): readonly string[] {
  return array(value).flatMap(entry => {
    if (typeof entry === "string") return [entry];
    const source = record(entry);
    const family: WordFamilySource = { base: string(source["base"]), suffixes: readStrings(source["suffixes"]) };
    return [family.base, ...family.suffixes.map(suffix => family.base + suffix)];
  });
}
export function readCompoundExceptions(value: unknown): readonly CompoundContractionExceptionSource[] {
  return array(value).map(entry => {
    const source = record(entry), contraction = member(source["contraction"], ["of", "the"]);
    const id: CompoundContractionExceptionSource["id"] = `UEB-10.3.1-${contraction}-compound-exception`;
    if (source["id"] !== id) throw new Error("Malformed compound exception id.");
    return { citation: iceb(source["citation"], "10.3.1"), contraction, id, words: readWords(source["words"]) };
  });
}
export function readSyllableExceptions(value: unknown): readonly FirstSyllableContractionExceptionSource[] {
  return array(value).map(entry => {
    const source = record(entry), contraction = member(source["contraction"], ["be", "con", "dis"]);
    const id: FirstSyllableContractionExceptionSource["id"] = `UEB-10.6.1-${contraction}-syllable-exception`;
    if (source["id"] !== id) throw new Error("Malformed syllable exception id.");
    return { citation: iceb(source["citation"], "10.6.1"), contraction, id, words: readWords(source["words"]) };
  });
}
export function readVowelWords(value: unknown): FirstSyllableVowelWordsSource {
  const source = record(value);
  return { citation: iceb(source["citation"], "10.6.1"), contraction: member(source["contraction"], ["be"]),
    id: member(source["id"], ["UEB-10.6.1-be-vowel-syllable-words"]), words: readWords(source["words"]) };
}
export function readInitialExceptions(value: unknown): readonly InitialContractionExceptionSource[] {
  return array(value).map(entry => {
    const source = record(entry), contraction = member(source["contraction"], ["ever", "had", "here", "name", "one", "some", "there", "these", "those", "time", "under", "upon", "whose"]);
    const locator = member(record(source["citation"])["locator"], ["10.7.2", "10.7.3", "10.7.4", "10.7.5", "10.7.6", "10.7.7", "10.7.8", "10.7.9"]);
    const id: InitialContractionExceptionSource["id"] = `UEB-${locator}-${contraction}-exception`;
    if (source["id"] !== id) throw new Error("Malformed initial exception id.");
    return { citation: iceb(source["citation"], locator), contraction, id, words: readWords(source["words"]) };
  });
}
export function readFinalExceptions(value: unknown): readonly FinalGroupsignExceptionSource[] {
  return array(value).map(entry => {
    const source = record(entry), groupsign = member(source["groupsign"], ["ity", "ness"]);
    const locator = groupsign === "ity" ? "10.8.3" : "10.8.4";
    const id = groupsign === "ity" ? "UEB-10.8.3-ity-exception" : "UEB-10.8.4-ness-exception";
    if (source["id"] !== id) throw new Error("Malformed final exception id.");
    return { citation: iceb(source["citation"], locator), endings: readStrings(source["endings"]), groupsign, id, words: readWords(source["words"]) };
  });
}
export function readInventory(value: unknown): { readonly appendix1LongerWords: number; readonly contextualRules: number; readonly rules: number; readonly shortforms: number } {
  const source = record(value);
  return { appendix1LongerWords: number(source["appendix1LongerWords"]), contextualRules: number(source["contextualRules"]), rules: number(source["rules"]), shortforms: number(source["shortforms"]) };
}

function cited<A extends string, D extends string, U extends string>(value: unknown, authority: A, document: D, url: U): RuleCitation<A, D, string, U> {
  const source = record(value);
  return { authority: member(source["authority"], [authority]), document: member(source["document"], [document]),
    locator: string(source["locator"]), url: member(source["url"], [url]) };
}
function technical<T>(value: unknown, decode: (value: unknown) => T): { readonly citation: TechnicalScriptSource["citation"]; readonly definitions: T } {
  const source = record(value);
  return { citation: cited(source["citation"], "ICEB", "Unified English Braille: Guidelines for Technical Material (2014)", "https://iceb.org/publications/ueb/"), definitions: decode(source["definitions"]) };
}
export function readTechnicalSignMappings(value: unknown): Pick<TechnicalSignProgram, "operations" | "comparisons" | "arrows"> {
  const source = record(value);
  return { operations: mapOf(source["operations"], TECHNICAL_OPERATIONS, isString), comparisons: mapOf(source["comparisons"], TECHNICAL_COMPARISONS, isString), arrows: mapOf(source["arrows"], TECHNICAL_ARROW_DIRECTIONS, isString) };
}
export function readTechnicalScriptRules(value: unknown): TechnicalScriptSource {
  return technical(value, definitions => mapOf(definitions, TECHNICAL_SCRIPT_PLACEMENTS,
    (value): value is TechnicalSignProgram["scripts"]["left-subscript"] => {
      const source = record(value);
      return isString(source["indicator"]) && (source["position"] === "before" || source["position"] === "after");
    }));
}
export function readTechnicalDelimiterRules(value: unknown): TechnicalDelimiterSource {
  return technical(value, value => { const source = record(value); return {
    groupOpen: string(source["groupOpen"]), groupClose: string(source["groupClose"]),
    simpleFractionLine: string(source["simpleFractionLine"]), fractionOpen: string(source["fractionOpen"]),
    fractionLine: string(source["fractionLine"]), fractionClose: string(source["fractionClose"]),
    radicalOpen: string(source["radicalOpen"]), radicalClose: string(source["radicalClose"]),
    enlargedPrefix: string(source["enlargedPrefix"]),
    enclosures: mapOf(source["enclosures"], TECHNICAL_ENCLOSURES, (value): value is { readonly open: string; readonly close: string } => {
      const pair = record(value); return isString(pair["open"]) && isString(pair["close"]);
    }),
    matrixEnclosures: mapOf(source["matrixEnclosures"], TECHNICAL_MATRIX_ENCLOSURES,
      (value): value is (typeof TECHNICAL_ENCLOSURES)[number] => TECHNICAL_ENCLOSURES.some(entry => entry === value)),
  }; });
}
export function readTechnicalModifierRules(value: unknown): TechnicalModifierSource { return technical(value, value => mapOf(value, TECHNICAL_MODIFIERS, isString)); }
export function readTechnicalShapeRules(value: unknown): TechnicalShapeSource {
  return technical(value, value => { const source = record(value); return {
    fills: mapOf(source["fills"], TECHNICAL_SHAPE_FILLS, isString), names: mapOf(source["names"], TECHNICAL_SHAPE_NAMES, isString), terminator: string(source["terminator"]),
  }; });
}
export function readTechnicalItemRules(value: unknown): TechnicalItemSource {
  return technical(value, value => { const source = record(value); return { kinds: mapOf(source["kinds"], TECHNICAL_ITEM_KINDS, isBoolean), identifierPattern: string(source["identifierPattern"]) }; });
}
export function readTechnicalValuePatterns(value: unknown): TechnicalSignProgram["valuePatterns"] { return mapOf(value, TECHNICAL_VALUE_KINDS, isString); }
export function readTechnicalOperationSpacingRules(value: unknown): TechnicalOperationSpacingSource {
  const source = record(value), bana = record(source["bana-2026"]);
  return { international: technical(source["international"], value => mapOf(value, ["spaced", "unspaced"], isBoolean)),
    "bana-2026": { citation: cited(bana["citation"], "BANA", "Guidance on Transcribing Mathematics and Science in UEB (2026)", "https://brailleauthority.org/node/50"), definitions: mapOf(bana["definitions"], ["standardized", "teaching"], isBoolean) } };
}
export function readTechnicalGrade1ProtectionRules(value: unknown): TechnicalGrade1ProtectionSource {
  const source = record(value), definitions = record(source["definitions"]);
  return { citation: cited(source["citation"], "ICEB", "Guidelines for Technical Material: replacement Section 1.7 (2025)", "https://iceb.org/publications/ueb/"), definitions: {
    standingValues: array(definitions["standingValues"]).map(value => { const rule = record(value); return {
      pattern: string(rule["pattern"]), flags: member(rule["flags"], ["u", "iu"]), kind: member(rule["kind"], ["standing-symbol", "standing-word"]),
    }; }), maxSymbolsPerSequence: number(definitions["maxSymbolsPerSequence"]), passageSequenceThreshold: number(definitions["passageSequenceThreshold"]),
  } };
}
export function readTechnicalFunctionSpacingRules(value: unknown): TechnicalFunctionSpacingSource {
  return technical(value, value => { const source = record(value); return { letterPrintPattern: string(source["letterPrintPattern"]), namePattern: string(source["namePattern"]) }; });
}
export function readTechnicalNumericContinuationRules(value: unknown): TechnicalNumericContinuationSource {
  const source = record(value), definitions = record(source["definitions"]);
  return { citation: cited(source["citation"], "ICEB", "Guidelines for Technical Material: Grade 1 Indicators (July 2025)", "https://iceb.org/publications/ueb/"), definitions: {
    precedingKinds: array(definitions["precedingKinds"]).map(value => member(value, [...TECHNICAL_ITEM_KINDS, "identifier"])), identifierPattern: string(definitions["identifierPattern"]),
  } };
}
export function readTechnicalComputerWhitespaceRules(value: unknown): TechnicalComputerWhitespaceSource {
  return technical(value, value => { const source = record(value); return { visibleSpace: string(source["visibleSpace"]), minimumRunLength: number(source["minimumRunLength"]), ordinaryEdgeLength: number(source["ordinaryEdgeLength"]) }; });
}
