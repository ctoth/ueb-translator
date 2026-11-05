/** JSON source decoding. Rule semantics are validated by the existing compilers. */
import { CITATION_DOCUMENT_DATA, sourceData } from "./source-manifest.js";
import type { ExpansionPolicy } from "./expansion-policy.js";
import { citeIceb, type IcebRuleCitation, type IcebRuleLocator, type Grade2ConstraintLocator, type RuleCitation } from "./source.js";
import type { SymbolFamily, SymbolRuleSource } from "./symbols/compiler.js";
import type { ModeRuleSource } from "./modes/compiler.js";
import { MODE_NAMES, MEMBER_CLASSES, POLICY_NAMES } from "./grade1-vocabulary.js";
import type { CompositionPolicySource } from "./policies/compiler.js";
import type { Grade2RuleKind, Grade2RuleFamilies, Grade2RuleSource, Grade2RuleSourceFor, Grade2RuleGroupSource, Grade2RuleVariant } from "./grade2-rules.js";
import type { Appendix1Base, Appendix1WordSource, Appendix1GroupSource } from "./appendix1.js";
import type { ShortformSource } from "./shortforms.js";
import type { ConstraintSource, WordFamilySource } from "./constraints.js";
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
const documentData: Readonly<Record<string, unknown>> = record(CITATION_DOCUMENT_DATA);
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
  const source = record(value);
  member(source["source"], ["ueb-2024"]);
  if (source["locator"] !== locator) throw new Error("Malformed JSON ICEB citation.");
  return { ...cited(value, "ICEB", "Rules of Unified English Braille, Third Edition (2024)", "https://iceb.org/publications/ueb/"), locator };
}
function generalCitation(value: unknown): IcebRuleCitation {
  return iceb(value, checked(record(value)["locator"], isLocator));
}
export function readStrings(value: unknown): readonly string[] { return checked(value, isStrings); }
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
      if (citation["source"] === "ueb-2024") return generalCitation(citation);
      member(citation["source"], ["technical-operations-2018"]);
      return { ...cited(citation, "ICEB", "Guidelines for Technical Material: Section 3, Signs of Operation and Comparison (2018)",
        "https://iceb.org/publications/ueb/"), locator: member(citation["locator"], ["Operation signs table, p. 1", "Comparison signs table, p. 1", "Comparison signs table, p. 2"]) };
    };
    return { braille: string(source["braille"]), citation: readCitation(), id: string(source["id"]),
      kind: member(source["kind"], ["digit", "letter", "modifier", "symbol"]),
      numericDigit: source["numericDigit"] === null ? null : string(source["numericDigit"]),
      print: string(source["print"]), uppercasePrint: source["uppercasePrint"] === null ? null : string(source["uppercasePrint"]) };
  });
}
export function readSymbolFamilies(value: unknown): readonly SymbolFamily[] {
  return array(value).map(entry => {
    const source = record(entry);
    const kind = member(source["kind"], ["pairs", "digits", "rules"]);
    const file = string(source["file"]);
    if (kind === "rules") return { kind, file };
    const citation = record(source["citation"]);
    const shared = {
      file, idPrefix: string(source["idPrefix"]),
      citation: { source: member(citation["source"], ["ueb-2024"]), locator: string(citation["locator"]) },
    };
    if (kind === "digits") return { ...shared, kind, prints: readStrings(source["prints"]) };
    return { ...shared, kind,
      symbolKind: member(source["symbolKind"], ["digit", "letter", "modifier", "symbol"]),
      idKey: member(source["idKey"], ["print", "utf16-hex"]),
      uppercase: checked(source["uppercase"], isBoolean),
    };
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
function readGuards(value: unknown): readonly ContextualRuleGuard[] {
  return array(value).map(guard => checked(guard, isGuard));
}
export function readLongerShortforms(value: unknown): readonly {
  readonly words: readonly string[]; readonly guards: readonly ContextualRuleGuard[];
}[] {
  return array(value).map(value => { const source = record(value); return {
    words: readStrings(source["words"]), guards: readGuards(source["guards"]),
  }; });
}
export function readShortformSuffixes(value: unknown): {
  readonly default: readonly string[];
  readonly exceptions: readonly { readonly words: readonly string[]; readonly suffixes: readonly string[] }[];
} {
  const source = record(value);
  return { default: readStrings(source["default"]), exceptions: array(source["exceptions"]).map(value => {
    const entry = record(value);
    return { words: readStrings(entry["words"]), suffixes: readStrings(entry["suffixes"]) };
  }) };
}
export function readGrade2Families(value: unknown): Grade2RuleFamilies {
  const source = record(value);
  function family<const L extends IcebRuleLocator>(name: string, locator: L): {
    readonly locator: L; readonly guards: readonly ContextualRuleGuard[];
  } {
    const entry = record(source[name]);
    return { locator: member(entry["locator"], [locator]), guards: readGuards(entry["guards"]) };
  }
  return {
    "alphabetic-wordsign": family("alphabetic-wordsign", "10.1"),
    "final-letter-groupsign": family("final-letter-groupsign", "10.8"),
    "initial-letter-contraction": family("initial-letter-contraction", "10.7"),
    "lower-groupsign": family("lower-groupsign", "10.6"),
    "lower-wordsign": family("lower-wordsign", "10.5"),
    "strong-contraction": family("strong-contraction", "10.3"),
    "strong-groupsign": family("strong-groupsign", "10.4"),
    "strong-wordsign": family("strong-wordsign", "10.2"),
  };
}
export function readGrade2Rules(value: unknown, kinds: readonly Grade2RuleKind[], families: Grade2RuleFamilies,
  policy: ExpansionPolicy = readExpansionPolicy(sourceData("expansion"))): readonly Grade2RuleSource[] {
  return array(value).flatMap<Grade2RuleSource>(entry => {
    const source = record(entry);
    const group: Grade2RuleGroupSource = { kind: member(source["kind"], kinds),
      guards: readGuards(source["guards"]),
      variants: source["variants"] === undefined ? [] : array(source["variants"]).map(value => {
        const variant = record(value);
        const locator = constraintLocator(variant["locator"]);
        return { idSuffix: string(variant["idSuffix"]), locator,
          precedence: member(variant["precedence"], CONTEXTUAL_PRECEDENCES), guards: readGuards(variant["guards"]) } satisfies Grade2RuleVariant;
      }),
      precedence: member(source["precedence"], CONTEXTUAL_PRECEDENCES), entries: readPairs(source["entries"]) };
    const { kind, guards, precedence, entries: pairs, variants } = group;
    function expand<K extends Grade2RuleKind>(selected: K): readonly Grade2RuleSourceFor<K>[] {
      const family = families[selected], selectedLocator = family.locator;
      return pairs.map(([print, braille]) => ({ braille, citation: citeIceb(selectedLocator),
        id: policy.ids.contractionPrefix + selectedLocator + policy.ids.separator + print,
        kind: selected, print, guards: [...family.guards, ...guards], precedence, variants }));
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
export function readShortforms(value: unknown,
  policy: ExpansionPolicy = readExpansionPolicy(sourceData("expansion"))): readonly ShortformSource[] {
  return readPairs(value).map(([print, braille]) => ({
    braille, citation: policy.citation, id: policy.ids.shortformPrefix + print, print,
  }));
}
export function readAppendixRules(value: unknown, bases: readonly Appendix1Base[],
  policy: ExpansionPolicy = readExpansionPolicy(sourceData("expansion"))): readonly Appendix1WordSource[] {
  return array(value).flatMap(entry => {
    const source = record(entry);
    const group: Appendix1GroupSource = { base: member(source["base"], bases), words: readStrings(source["words"]) };
    return group.words.map(print => ({
      base: group.base, citation: policy.citation,
      id: policy.ids.appendixPrefix + group.base + policy.ids.separator + print, print,
    }));
  });
}
export function readExpansionPolicy(value: unknown): ExpansionPolicy {
  const source = record(value), ids = record(source["ids"]), possessives = record(source["possessives"]);
  const kinds = (value: unknown): readonly Grade2RuleKind[] => array(value).map(entry =>
    member(entry, ["alphabetic-wordsign", "final-letter-groupsign", "initial-letter-contraction",
      "lower-groupsign", "lower-wordsign", "strong-contraction", "strong-groupsign", "strong-wordsign"]));
  const extensions = record(source["suffixExtensions"]);
  return {
    citation: generalCitation(source["citation"]),
    ids: { contractionPrefix: string(ids["contractionPrefix"]), separator: string(ids["separator"]),
      shortformPrefix: string(ids["shortformPrefix"]), longerSuffix: string(ids["longerSuffix"]),
      appendixPrefix: string(ids["appendixPrefix"]) },
    shortformPrecedence: member(source["shortformPrecedence"], CONTEXTUAL_PRECEDENCES),
    longerPrecedence: member(source["longerPrecedence"], CONTEXTUAL_PRECEDENCES),
    appendixPrecedence: member(source["appendixPrecedence"], CONTEXTUAL_PRECEDENCES),
    pluralSuffix: string(source["pluralSuffix"]),
    shortformGuards: readGuards(source["shortformGuards"]), appendixGuards: readGuards(source["appendixGuards"]),
    collisionKinds: kinds(source["collisionKinds"]), standingWordKinds: kinds(source["standingWordKinds"]),
    standingLiteralKinds: kinds(source["standingLiteralKinds"]),
    latinKind: member(source["latinKind"], ["digit", "letter", "modifier", "symbol"]),
    latinPattern: string(source["latinPattern"]),
    suffixExtensions: Object.fromEntries(Object.entries(extensions).map(([key, value]) => [key, readStrings(value)])),
    possessives: { suffixes: readStrings(possessives["suffixes"]), endings: array(possessives["endings"]).map(value => {
      const entry = record(value);
      return { ending: string(entry["ending"]), suffixes: readStrings(entry["suffixes"]) };
    }) },
  };
}
function readWords(value: unknown): readonly string[] {
  return array(value).flatMap(entry => {
    if (typeof entry === "string") return [entry];
    const source = record(entry);
    const family: WordFamilySource = { base: string(source["base"]), suffixes: readStrings(source["suffixes"]) };
    return [family.base, ...family.suffixes.map(suffix => family.base + suffix)];
  });
}
function constraintLocator(value: unknown): Grade2ConstraintLocator {
  return member(value, ["10.3.1", "10.6.1", "10.10", "10.7.2", "10.7.3", "10.7.4", "10.7.5",
    "10.7.6", "10.7.7", "10.7.8", "10.7.9", "10.8.3", "10.8.4"]);
}

export function readConstraints(value: unknown, rules: readonly Grade2RuleSource[],
  policy: ExpansionPolicy = readExpansionPolicy(sourceData("expansion"))): readonly ConstraintSource[] {
  return array(value).map(value => {
    const source = record(value), selected = record(source["target"]);
    const target = rules.find(rule => rule.kind === selected["kind"] && rule.print === selected["print"]);
    if (target === undefined) throw new Error("Unknown constraint target.");
    const locator = constraintLocator(record(source["citation"])["locator"]);
    const guards = array(source["guards"]).flatMap((value): readonly ContextualRuleGuard[] => {
      const guard = record(value), kind = member(guard["kind"],
        ["not-word", "not-word-ending", "following-not-vowel-y-except-words"]);
      if (kind === "not-word-ending") {
        const endings = readStrings(guard["endings"]);
        return endings.length === 0 ? [] : [{ kind, endings }];
      }
      const possessives = checked(guard["possessives"], isBoolean);
      const words = readWords(guard["words"]).flatMap(word =>
        possessives ? [word, ...policy.possessives.suffixes.map(suffix => word + suffix),
          ...policy.possessives.endings.filter(entry => word.endsWith(entry.ending))
            .flatMap(entry => entry.suffixes.map(suffix => word + suffix))] : [word]);
      if (kind === "not-word") {
        const ignoredCharacters = string(guard["ignoredCharacters"]);
        return words.length === 0 ? [] : [{ kind, words, ignoredCharacters }];
      }
      return [{ kind, words, characters: string(guard["characters"]) }];
    });
    return { citation: iceb(source["citation"], locator),
      target: { kind: target.kind, print: target.print }, guards };
  });
}
export function readInventory(value: unknown): { readonly appendix1LongerWords: number; readonly contextualRules: number; readonly rules: number; readonly shortforms: number } {
  const source = record(value);
  return { appendix1LongerWords: number(source["appendix1LongerWords"]), contextualRules: number(source["contextualRules"]), rules: number(source["rules"]), shortforms: number(source["shortforms"]) };
}

function cited<A extends string, D extends string, U extends string>(value: unknown, authority: A, document: D, url: U): RuleCitation<A, D, string, U> {
  const reference = record(value), source = record(record(documentData)[string(reference["source"])]);
  return { authority: member(source["authority"], [authority]), document: member(source["document"], [document]),
    locator: string(reference["locator"]), url: member(source["url"], [url]) };
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
