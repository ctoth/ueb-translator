import { sourceData } from "./source-manifest.js";
import { readTechnicalSignMappings, readSymbolRules, readTechnicalDelimiterRules, readTechnicalModifierRules, readTechnicalScriptRules, readTechnicalShapeRules, readTechnicalItemRules, readTechnicalValuePatterns, readTechnicalOperationSpacingRules, readTechnicalGrade1ProtectionRules, readTechnicalFunctionSpacingRules, readTechnicalNumericContinuationRules, readTechnicalComputerWhitespaceRules, readTechnicalLayoutRules } from "./rule-json.js";
import { loadSymbolProgram } from "../../src/symbol-program.js";
import { TECHNICAL_VALUE_KINDS, TECHNICAL_MODIFIERS, TECHNICAL_SCRIPT_PLACEMENTS, TECHNICAL_SHAPE_FILLS, TECHNICAL_SHAPE_NAMES, type TechnicalEnclosure, type TechnicalSignProgram } from "../../src/technical-program.js";
import type { RuleCitation } from "./source.js";
import { compileSymbols, type SymbolRuleSource } from "./symbols/compiler.js";

/**
 * Semantic print references: operations/comparisons follow ICEB October 2018
 * replacement Section 3 (pp.1-2); arrows follow GTM 2014 13.1 (p.60).
 * Cell definitions remain in the shared symbol inventory.
 */
export const TECHNICAL_SIGN_MAPPINGS: Pick<TechnicalSignProgram, "operations" | "comparisons" | "arrows"> = readTechnicalSignMappings(sourceData("technical", "mappings"));

export const TECHNICAL_SYMBOL_RULES: readonly SymbolRuleSource[] = readSymbolRules(sourceData("technical", "symbols"));

interface TechnicalRuleSource<Definitions> {
  readonly citation: RuleCitation;
  readonly definitions: Definitions;
}
export type TechnicalScriptSource = TechnicalRuleSource<TechnicalSignProgram["scripts"]>;
export type TechnicalDelimiterSource = TechnicalRuleSource<
  Omit<TechnicalSignProgram["delimiters"], "matrixEnclosures"> & {
    readonly enlargedPrefix: string;
    readonly matrixEnclosures: Readonly<Record<
      keyof TechnicalSignProgram["delimiters"]["matrixEnclosures"], TechnicalEnclosure
    >>;
  }
>;

export const TECHNICAL_DELIMITER_RULES: TechnicalDelimiterSource = readTechnicalDelimiterRules(sourceData("technical", "delimiters"));

export interface TechnicalModifierSource {
  readonly citation: TechnicalScriptSource["citation"];
  readonly definitions: TechnicalSignProgram["modifiers"];
}

export const TECHNICAL_MODIFIER_RULES: TechnicalModifierSource = readTechnicalModifierRules(sourceData("technical", "modifiers"));

export const TECHNICAL_SCRIPT_RULES: TechnicalScriptSource = readTechnicalScriptRules(sourceData("technical", "scripts"));

export interface TechnicalShapeSource {
  readonly citation: TechnicalScriptSource["citation"];
  readonly definitions: TechnicalSignProgram["shapes"];
}

export const TECHNICAL_SHAPE_RULES: TechnicalShapeSource = readTechnicalShapeRules(sourceData("technical", "shapes"));

export type TechnicalItemSource = TechnicalRuleSource<TechnicalSignProgram["itemPolicy"]>;

export const TECHNICAL_ITEM_RULES: TechnicalItemSource = readTechnicalItemRules(sourceData("technical", "items"));

/** Accepted structured API inputs, not a normative list of chemical elements. */
export const TECHNICAL_VALUE_PATTERNS: TechnicalSignProgram["valuePatterns"] = readTechnicalValuePatterns(sourceData("technical", "valuePatterns"));

export interface TechnicalOperationSpacingSource {
  readonly international: TechnicalRuleSource<TechnicalSignProgram["operationSpacing"]["international"]>;
  readonly "bana-2026": {
    readonly citation: RuleCitation;
    readonly definitions: TechnicalSignProgram["operationSpacing"]["bana-2026"];
  };
}

export const TECHNICAL_OPERATION_SPACING_RULES: TechnicalOperationSpacingSource = readTechnicalOperationSpacingRules(sourceData("technical", "spacing"));

export interface TechnicalGrade1ProtectionSource {
  readonly citation: RuleCitation;
  readonly definitions: TechnicalSignProgram["grade1Protection"];
}

export const TECHNICAL_GRADE1_PROTECTION_RULES: TechnicalGrade1ProtectionSource = readTechnicalGrade1ProtectionRules(sourceData("technical", "protection"));

export type TechnicalFunctionSpacingSource = TechnicalRuleSource<{
  readonly letterPrintPattern: string;
  readonly namePattern: string;
}>;

export const TECHNICAL_FUNCTION_SPACING_RULES: TechnicalFunctionSpacingSource = readTechnicalFunctionSpacingRules(sourceData("technical", "functionSpacing"));

export interface TechnicalNumericContinuationSource {
  readonly citation: RuleCitation;
  readonly definitions: TechnicalSignProgram["numericContinuation"];
}

export const TECHNICAL_NUMERIC_CONTINUATION_RULES: TechnicalNumericContinuationSource = readTechnicalNumericContinuationRules(sourceData("technical", "numericContinuation"));

export type TechnicalComputerWhitespaceSource = TechnicalRuleSource<TechnicalSignProgram["computerWhitespace"]>;

export const TECHNICAL_COMPUTER_WHITESPACE_RULES: TechnicalComputerWhitespaceSource = readTechnicalComputerWhitespaceRules(sourceData("technical", "computerWhitespace"));

export interface TechnicalLayoutSource {
  readonly citations: readonly RuleCitation[];
  readonly definitions: TechnicalSignProgram["layouts"];
}

export const TECHNICAL_LAYOUT_RULES: TechnicalLayoutSource = readTechnicalLayoutRules(sourceData("technical", "layouts"));

export function compileTechnicalSigns(
  general: readonly SymbolRuleSource[],
  additional: readonly SymbolRuleSource[],
  mappings: Pick<TechnicalSignProgram, "operations" | "comparisons" | "arrows">,
  scripts: TechnicalScriptSource,
  modifiers: TechnicalModifierSource,
  shapes: TechnicalShapeSource,
  delimiters: TechnicalDelimiterSource,
  items: TechnicalItemSource,
  valuePatterns: TechnicalSignProgram["valuePatterns"],
  spacing: TechnicalOperationSpacingSource,
  protection: TechnicalGrade1ProtectionSource,
  functionSpacing: TechnicalFunctionSpacingSource,
  numericContinuation: TechnicalNumericContinuationSource,
  computerWhitespace: TechnicalComputerWhitespaceSource,
  layouts: TechnicalLayoutSource,
): TechnicalSignProgram {
  const compiled = compileSymbols([...general, ...additional]).runtime;
  const runtime = loadSymbolProgram(compiled);
  for (const print of [...Object.values(mappings.operations), ...Object.values(mappings.comparisons),
    ...Object.values(mappings.arrows)]) {
    if (!runtime.symbols.has(print)) {
      throw new Error(`Technical sign references missing symbol ${JSON.stringify(print)}.`);
    }
  }
  if (items.definitions.identifierPattern.length === 0) {
    throw new Error("Technical item identifier pattern is empty.");
  }
  const identifierPattern = new RegExp(items.definitions.identifierPattern, "u");
  const letterPrintPattern = new RegExp(functionSpacing.definitions.letterPrintPattern, "u");
  const functionNamePattern = new RegExp(functionSpacing.definitions.namePattern, "u");
  if (numericContinuation.definitions.identifierPattern.length === 0) {
    throw new Error("Technical numeric continuation identifier pattern is empty.");
  }
  const numericIdentifierPattern = new RegExp(numericContinuation.definitions.identifierPattern, "u");
  const compiledPatterns = { ...valuePatterns };
  for (const kind of TECHNICAL_VALUE_KINDS) {
    if (compiledPatterns[kind].length === 0) {
      throw new Error(`Technical value pattern ${kind} is empty.`);
    }
    compiledPatterns[kind] = new RegExp(compiledPatterns[kind], "u").source;
  }
  const grade1Protection = protection.definitions;
  for (const threshold of [grade1Protection.maxSymbolsPerSequence, grade1Protection.passageSequenceThreshold]) {
    if (!Number.isSafeInteger(threshold) || threshold < 1) {
      throw new Error("Technical Grade 1 protection thresholds must be positive integers.");
    }
  }
  if (grade1Protection.standingValues.length === 0) {
    throw new Error("Technical Grade 1 standing classifiers are empty.");
  }
  const standingValues = grade1Protection.standingValues.map((rule) => {
    if (rule.pattern.length === 0 || !["iu", "u"].includes(rule.flags) ||
      !["standing-symbol", "standing-word"].includes(rule.kind)) {
      throw new Error("Technical Grade 1 standing classifier is malformed.");
    }
    return { ...rule, pattern: new RegExp(rule.pattern, rule.flags).source };
  });
  const additionalPrints = new Set(additional.map((rule) => rule.print));
  for (const citation of [...[scripts, modifiers, shapes, delimiters, items, spacing.international, spacing["bana-2026"], protection, functionSpacing, numericContinuation, computerWhitespace].map((source) => source.citation), ...layouts.citations]) {
    const authority = citation.authority;
    const officialHost = authority === "BANA" ? "https://brailleauthority.org/" : "https://iceb.org/";
    if (citation.locator.trim().length === 0 ||
      !citation.url.startsWith(officialHost)) {
      throw new Error(`Technical definitions lack an official ${authority} citation.`);
    }
  }
  const whitespace = computerWhitespace.definitions;
  if (!/^[\u2800-\u28ff]$/u.test(whitespace.visibleSpace) ||
    !Number.isInteger(whitespace.minimumRunLength) || !Number.isInteger(whitespace.ordinaryEdgeLength) ||
    whitespace.ordinaryEdgeLength < 0 || whitespace.minimumRunLength <= 2 * whitespace.ordinaryEdgeLength) {
    throw new Error("Technical computer whitespace has malformed definitions.");
  }
  for (const modifier of TECHNICAL_MODIFIERS) {
    if (!/^[\u2800-\u28ff]+$/u.test(modifiers.definitions[modifier])) {
      throw new Error(`Technical modifier ${modifier} has malformed cells.`);
    }
  }
  for (const placement of TECHNICAL_SCRIPT_PLACEMENTS) {
    if (!/^[\u2800-\u28ff]+$/u.test(scripts.definitions[placement].indicator)) {
      throw new Error(`Technical script ${placement} has a malformed indicator.`);
    }
  }
  const { enclosures: enclosurePrint, matrixEnclosures: matrixNames, enlargedPrefix,
    ...signs } = delimiters.definitions;
  for (const [name, cells] of Object.entries({ ...signs, enlargedPrefix })) {
    if (!/^[\u2800-\u28ff]+$/u.test(cells)) {
      throw new Error(`Technical delimiter ${name} has malformed cells.`);
    }
  }
  const symbol = (print: string): string => {
    const cells = runtime.symbols.get(print)?.braille;
    if (cells === undefined) {
      throw new Error(`Technical delimiter references missing symbol ${JSON.stringify(print)}.`);
    }
    return cells;
  };
  const enclosure = (name: TechnicalEnclosure): { open: string; close: string } => ({
    open: symbol(enclosurePrint[name].open), close: symbol(enclosurePrint[name].close),
  });
  const enclosures = {
    absolute: enclosure("absolute"), angle: enclosure("angle"), curly: enclosure("curly"),
    round: enclosure("round"), square: enclosure("square"),
  };
  const matrixEnclosure = (name: keyof typeof matrixNames): { open: string; close: string } => ({
    open: enlargedPrefix + enclosures[matrixNames[name]].open,
    close: enlargedPrefix + enclosures[matrixNames[name]].close,
  });
  const matrixEnclosures = {
    curly: matrixEnclosure("curly"), determinant: matrixEnclosure("determinant"),
    round: matrixEnclosure("round"), square: matrixEnclosure("square"),
  };
  for (const cells of [
    ...TECHNICAL_SHAPE_FILLS.map((fill) => shapes.definitions.fills[fill]),
    ...TECHNICAL_SHAPE_NAMES.map((name) => shapes.definitions.names[name]),
    shapes.definitions.terminator,
  ]) {
    if (!/^[\u2800-\u28ff]+$/u.test(cells)) {
      throw new Error("Technical shape has malformed cells.");
    }
  }
  return {
    layouts: layouts.definitions,
    computerWhitespace: { ...whitespace },
    numericContinuation: {
      precedingKinds: [...numericContinuation.definitions.precedingKinds],
      identifierPattern: numericIdentifierPattern.source,
    },
    functionSpacing: {
      letterCells: compiled.symbols.filter((symbol) => letterPrintPattern.test(symbol.print))
        .map((symbol) => symbol.braille),
      namePattern: functionNamePattern.source,
    },
    grade1Protection: { ...grade1Protection, standingValues },
    operationSpacing: {
      international: { ...spacing.international.definitions },
      "bana-2026": { ...spacing["bana-2026"].definitions },
    },
    valuePatterns: compiledPatterns,
    itemPolicy: { kinds: { ...items.definitions.kinds }, identifierPattern: identifierPattern.source },
    symbols: compiled.symbols.filter((symbol) => additionalPrints.has(symbol.print)),
    operations: { ...mappings.operations }, comparisons: { ...mappings.comparisons },
    arrows: { ...mappings.arrows },
    scripts: { ...scripts.definitions },
    delimiters: { ...signs, enclosures, matrixEnclosures },
    modifiers: { ...modifiers.definitions },
    shapes: {
      fills: { ...shapes.definitions.fills },
      names: { ...shapes.definitions.names },
      terminator: shapes.definitions.terminator,
    },
  };
}
