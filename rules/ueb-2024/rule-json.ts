/** JSON source decoding. Rule semantics are validated by the existing compilers. */
import { cite, type RuleCitation } from "./source.js";
import type { SymbolFamily, SymbolRuleSource } from "./symbols/compiler.js";
import type { ModeRuleSource } from "./modes/compiler.js";
import { MODE_NAMES, MEMBER_CLASSES, POLICY_NAMES } from "./grade1-vocabulary.js";
import type { CompositionPolicySource } from "./policies/compiler.js";
import type { Grade2RuleSource, Grade2RuleVariant } from "./grade2-rules.js";
import type { Appendix1WordSource } from "./appendix1.js";
import type { ShortformSource } from "./shortforms.js";
import type { ConstraintSource } from "./constraints.js";
import type { ContextualRuleSource } from "./contextual-compiler.js";
import { readGuard, type ContextualRuleGuard } from "./contextual-engine.js";
import type {
  TechnicalScriptSource, TechnicalDelimiterSource, TechnicalModifierSource, TechnicalShapeSource,
  TechnicalItemSource, TechnicalOperationSpacingSource, TechnicalGrade1ProtectionSource,
  TechnicalFunctionSpacingSource, TechnicalNumericContinuationSource, TechnicalComputerWhitespaceSource,
  TechnicalLayoutSource,
} from "./technical-signs.js";
import {
  TECHNICAL_OPERATIONS, TECHNICAL_COMPARISONS, TECHNICAL_ARROW_DIRECTIONS,
  TECHNICAL_SCRIPT_PLACEMENTS, TECHNICAL_MODIFIERS, TECHNICAL_SHAPE_NAMES, TECHNICAL_SHAPE_FILLS,
  TECHNICAL_ITEM_KINDS, TECHNICAL_VALUE_KINDS, TECHNICAL_ENCLOSURES, TECHNICAL_MATRIX_ENCLOSURES,
  TECHNICAL_DELIMITER_SIGNS, isTechnicalLayouts, type TechnicalSignProgram,
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
export function mapOf<K extends string, T>(value: unknown, keys: readonly K[], predicate: (entry: unknown) => entry is T): Readonly<Record<K, T>> {
  return checked(value, (candidate): candidate is Readonly<Record<K, T>> => {
    const entries = record(candidate);
    return Object.keys(entries).length === keys.length && keys.every(key => predicate(entries[key]));
  });
}
function locator(value: unknown): string {
  const text = string(value);
  if (text.trim().length === 0) throw new Error("Empty citation locator.");
  return text;
}
/** A citation reference: {source: document key, locator}. Documents come only from citation-documents.json. */
function cited(value: unknown): RuleCitation {
  const reference = record(value);
  return cite(string(reference["source"]), locator(reference["locator"]));
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
    const source = record(entry);
    return { braille: string(source["braille"]), citation: cited(source["citation"]), id: string(source["id"]),
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
    return { citation: cited(source["citation"]), id: string(source["id"]), name: member(source["name"], MODE_NAMES),
      definition: { continuesThrough: array(definition["continuesThrough"]).map(entry => member(entry, MEMBER_CLASSES)),
        indicators: mapOf(definition["indicators"], ["passage", "symbol", "terminator", "word"], isString),
        memberClass: member(definition["memberClass"], MEMBER_CLASSES), passageThreshold: number(definition["passageThreshold"]),
        terminatedBy: array(definition["terminatedBy"]).map(entry => member(entry, MEMBER_CLASSES)) } };
  });
}
export function readCompositionRules(value: unknown): readonly CompositionPolicySource[] {
  return array(value).map(entry => { const source = record(entry); return {
    citation: cited(source["citation"]), id: string(source["id"]), members: readStrings(source["members"]), name: member(source["name"], POLICY_NAMES),
  }; });
}
function readGuards(value: unknown): readonly ContextualRuleGuard[] {
  return array(value).map(readGuard);
}
/** Decoders for expansion-pipeline.json output tables; citations arrive resolved. */
function resolvedCitation(value: unknown): RuleCitation {
  const source = record(value);
  return { authority: string(source["authority"]), document: string(source["document"]),
    locator: locator(source["locator"]), url: string(source["url"]) };
}
export function readExpandedGrade2Rule(value: unknown): Grade2RuleSource {
  const source = record(value);
  return { braille: string(source["braille"]), citation: resolvedCitation(source["citation"]), id: string(source["id"]),
    kind: string(source["kind"]), print: string(source["print"]), guards: readGuards(source["guards"]),
    precedence: member(source["precedence"], CONTEXTUAL_PRECEDENCES),
    variants: array(source["variants"]).map((value): Grade2RuleVariant => {
      const variant = record(value);
      return { idSuffix: string(variant["idSuffix"]), locator: locator(variant["locator"]),
        precedence: member(variant["precedence"], CONTEXTUAL_PRECEDENCES), guards: readGuards(variant["guards"]) };
    }) };
}
export function readExpandedShortform(value: unknown): ShortformSource {
  const source = record(value);
  return { braille: string(source["braille"]), citation: resolvedCitation(source["citation"]), id: string(source["id"]), print: string(source["print"]) };
}
export function readExpandedAppendixWord(value: unknown): Appendix1WordSource {
  const source = record(value);
  return { base: string(source["base"]), citation: resolvedCitation(source["citation"]), id: string(source["id"]), print: string(source["print"]) };
}
export function readExpandedConstraint(value: unknown): ConstraintSource {
  const source = record(value), target = record(source["target"]);
  return { citation: resolvedCitation(source["citation"]), target: { kind: string(target["kind"]), print: string(target["print"]) },
    guards: readGuards(source["guards"]) };
}
export function readExpandedContextualRule(value: unknown): ContextualRuleSource {
  const source = record(value);
  return { braille: string(source["braille"]), citation: resolvedCitation(source["citation"]), guards: readGuards(source["guards"]),
    id: string(source["id"]), input: string(source["input"]), precedence: member(source["precedence"], CONTEXTUAL_PRECEDENCES) };
}
type FactValue = boolean | string | readonly FactValue[] | { readonly [key: string]: FactValue };
/** Facts are plain JSON: strings, booleans, lists and records of facts. */
function factValue(value: unknown): FactValue {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(factValue);
  return Object.fromEntries(Object.entries(record(value)).map(([key, entry]) => [key, factValue(entry)]));
}
/** Runtime fact groups: each group is cited; the runtime receives the group without its citation. */
export function readRuntimeFacts(value: unknown): Readonly<Record<string, Readonly<Record<string, FactValue>>>> {
  return Object.fromEntries(Object.entries(record(value)).map(([name, group]) => {
    const { citation, ...facts } = record(group);
    cited(citation);
    if (Object.keys(facts).length === 0) throw new Error(`Runtime fact group ${name} is empty.`);
    return [name, Object.fromEntries(Object.entries(facts).map(([key, entry]) => [key, factValue(entry)]))];
  }));
}
export function readInventory(value: unknown): { readonly appendix1LongerWords: number; readonly contextualRules: number; readonly rules: number; readonly shortforms: number } {
  const source = record(value);
  return { appendix1LongerWords: number(source["appendix1LongerWords"]), contextualRules: number(source["contextualRules"]), rules: number(source["rules"]), shortforms: number(source["shortforms"]) };
}

function technical<T>(value: unknown, decode: (value: unknown) => T): { readonly citation: RuleCitation; readonly definitions: T } {
  const source = record(value);
  return { citation: cited(source["citation"]), definitions: decode(source["definitions"]) };
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
/** An enclosure's {open, close} pair of prints or cells. */
export function isPair(value: unknown): value is { readonly open: string; readonly close: string } {
  const pair = record(value); return isString(pair["open"]) && isString(pair["close"]);
}
export function readTechnicalDelimiterRules(value: unknown): TechnicalDelimiterSource {
  return technical(value, value => { const { enlargedPrefix, enclosures, matrixEnclosures, ...signs } = record(value); return {
    ...mapOf(signs, TECHNICAL_DELIMITER_SIGNS, isString),
    enlargedPrefix: string(enlargedPrefix),
    enclosures: mapOf(enclosures, TECHNICAL_ENCLOSURES, isPair),
    matrixEnclosures: mapOf(matrixEnclosures, TECHNICAL_MATRIX_ENCLOSURES,
      (value): value is (typeof TECHNICAL_ENCLOSURES)[number] => TECHNICAL_ENCLOSURES.some(entry => entry === value)),
  }; });
}
export function readTechnicalModifierRules(value: unknown): TechnicalModifierSource { return technical(value, value => mapOf(value, TECHNICAL_MODIFIERS, isString)); }
export function readTechnicalLayoutRules(value: unknown): TechnicalLayoutSource {
  const citations: RuleCitation[] = [];
  const definitions = Object.fromEntries(Object.entries(record(value)).map(([kind, entry]) => {
    const { citation, ...layout } = record(entry);
    citations.push(cited(citation));
    return [kind, layout];
  }));
  return { citations, definitions: checked(definitions, isTechnicalLayouts) };
}
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
  const source = record(value);
  const spacing = <Value extends string>(rule: unknown, values: readonly Value[]) => ({
    ...technical(rule, value => mapOf(value, values, isBoolean)), field: string(record(rule)["field"]),
  });
  return { international: spacing(source["international"], ["spaced", "unspaced"]),
    "bana-2026": spacing(source["bana-2026"], ["standardized", "teaching"]) };
}
export function readTechnicalGrade1ProtectionRules(value: unknown): TechnicalGrade1ProtectionSource {
  const source = record(value), definitions = record(source["definitions"]);
  return { citation: cited(source["citation"]), definitions: {
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
  return { citation: cited(source["citation"]), definitions: {
    precedingKinds: array(definitions["precedingKinds"]).map(value => member(value, [...TECHNICAL_ITEM_KINDS, "identifier"])), identifierPattern: string(definitions["identifierPattern"]),
  } };
}
export function readTechnicalComputerWhitespaceRules(value: unknown): TechnicalComputerWhitespaceSource {
  return technical(value, value => { const source = record(value); return { visibleSpace: string(source["visibleSpace"]), minimumRunLength: number(source["minimumRunLength"]), ordinaryEdgeLength: number(source["ordinaryEdgeLength"]) }; });
}
