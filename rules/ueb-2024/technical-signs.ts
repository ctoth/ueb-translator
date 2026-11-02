import { loadSymbolProgram } from "../../src/symbol-program.js";
import { TECHNICAL_VALUE_KINDS, TECHNICAL_MODIFIERS, TECHNICAL_SCRIPT_PLACEMENTS, TECHNICAL_SHAPE_FILLS, TECHNICAL_SHAPE_NAMES, type TechnicalEnclosure, type TechnicalSignProgram } from "../../src/technical-program.js";
import { citeTechnicalSign, type RuleCitation, type TechnicalSignLocator } from "./source.js";
import { compileSymbols, type SymbolRuleSource } from "./symbols/compiler.js";

/**
 * Semantic print references: operations/comparisons follow ICEB October 2018
 * replacement Section 3 (pp.1-2); arrows follow GTM 2014 13.1 (p.60).
 * Cell definitions remain in the shared symbol inventory.
 */
export const TECHNICAL_SIGN_MAPPINGS: Pick<TechnicalSignProgram, "operations" | "comparisons" | "arrows"> = {
  arrows: {
    down: "↓", "down-left": "↙", "down-right": "↘", left: "←",
    right: "→", up: "↑", "up-left": "↖", "up-right": "↗",
  },
  operations: {
    asterisk: "*", divide: "÷", dot: "⋅", minus: "−", multiply: "×",
    plus: "+", "plus-or-minus": "±",
  },
  comparisons: {
    "approximately-equal": "≈", equals: "=", "greater-than": ">",
    "greater-than-or-equal": "≥", "less-than": "<",
    "less-than-or-equal": "≤", "not-equal": "≠",
  },
};

const additionalSigns = [
  ["⋅", "⠐⠲", "Operation signs table, p. 1"],
  ["±", "⠸⠖", "Operation signs table, p. 1"],
  ["≈", "⠸⠔", "Comparison signs table, p. 2"],
  ["≥", "⠸⠈⠜", "Comparison signs table, p. 1"],
  ["≤", "⠸⠈⠣", "Comparison signs table, p. 1"],
  ["≠", "⠐⠶⠈⠱", "Comparison signs table, p. 1"],
] satisfies readonly (readonly [string, string, TechnicalSignLocator])[];

export const TECHNICAL_SYMBOL_RULES: readonly SymbolRuleSource[] = additionalSigns.map(
  ([print, braille, locator]): SymbolRuleSource => ({
    braille, citation: citeTechnicalSign(locator),
    id: `UEB-GTM-2018-3-symbol-${print.charCodeAt(0).toString(16)}`,
    kind: "symbol", numericDigit: null, print, uppercasePrint: null,
  }),
);

interface TechnicalRuleSource<Definitions> {
  readonly citation: RuleCitation<
    "ICEB", "Unified English Braille: Guidelines for Technical Material (2014)",
    string, "https://iceb.org/publications/ueb/"
  >;
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

export const TECHNICAL_DELIMITER_RULES: TechnicalDelimiterSource = {
  citation: {
    authority: "ICEB",
    document: "Unified English Braille: Guidelines for Technical Material (2014)",
    locator: "5, p.30; 6, pp.31-32; 7.1-7.3, pp.34-36; 8, pp.40-41; 15.1, p.69",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    groupOpen: "⠣", groupClose: "⠜", simpleFractionLine: "⠌",
    fractionOpen: "⠷", fractionLine: "⠨⠌", fractionClose: "⠾",
    radicalOpen: "⠩", radicalClose: "⠬",
    enclosures: {
      absolute: { open: "|", close: "|" }, angle: { open: "⟨", close: "⟩" },
      curly: { open: "{", close: "}" }, round: { open: "(", close: ")" },
      square: { open: "[", close: "]" },
    },
    enlargedPrefix: "⠠",
    matrixEnclosures: { curly: "curly", determinant: "absolute", round: "round", square: "square" },
  },
};

export interface TechnicalModifierSource {
  readonly citation: TechnicalScriptSource["citation"];
  readonly definitions: TechnicalSignProgram["modifiers"];
}

export const TECHNICAL_MODIFIER_RULES: TechnicalModifierSource = {
  citation: {
    authority: "ICEB",
    document: "Unified English Braille: Guidelines for Technical Material (2014)",
    locator: "12 indicator list, p.57",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    "arc-above": "⠨⠸⠱",
    "bar-above": "⠱",
    "bar-below": "⠠⠱",
    "dot-above": "⠘⠲",
    "dot-below": "⠠⠘⠲",
    "hat-above": "⠐⠱",
    "hat-below": "⠠⠐⠱",
    "line-through": "⠈⠱",
    "right-arrow-above": "⠘⠱",
    "right-arrow-below": "⠠⠘⠱",
    "tilde-above": "⠸⠱",
    "tilde-below": "⠠⠸⠱",
  },
};

const subscript = "⠢", superscript = "⠔";
export const TECHNICAL_SCRIPT_RULES: TechnicalScriptSource = {
  citation: {
    authority: "ICEB",
    document: "Unified English Braille: Guidelines for Technical Material (2014)",
    locator: "7 indicator list, p.34; 7.3, pp.35-36; 7.8, p.38; 7.9, p.39",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    "directly-above": { indicator: `⠨${superscript}`, position: "after" },
    "directly-below": { indicator: `⠨${subscript}`, position: "after" },
    "left-subscript": { indicator: subscript, position: "before" },
    "left-superscript": { indicator: superscript, position: "before" },
    "right-subscript": { indicator: subscript, position: "after" },
    "right-superscript": { indicator: superscript, position: "after" },
  },
};

export interface TechnicalShapeSource {
  readonly citation: TechnicalScriptSource["citation"];
  readonly definitions: TechnicalSignProgram["shapes"];
}

export const TECHNICAL_SHAPE_RULES: TechnicalShapeSource = {
  citation: {
    authority: "ICEB",
    document: "Unified English Braille: Guidelines for Technical Material (2014)",
    locator: "14 shape indicator and specific shape lists, p.65; 14.1, p.66",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    fills: { filled: "⠸⠫", outline: "⠫", shaded: "⠨⠫" },
    names: {
      circle: "⠿", hexagon: "⠼⠋", heptagon: "⠼⠛", octagon: "⠼⠓",
      parallelogram: "⠈⠼⠙", pentagon: "⠼⠑", square: "⠼⠙", triangle: "⠼⠉",
    },
    terminator: "⠱",
  },
};

export type TechnicalItemSource = TechnicalRuleSource<TechnicalSignProgram["itemPolicy"]>;

export const TECHNICAL_ITEM_RULES: TechnicalItemSource = {
  citation: {
    authority: "ICEB",
    document: "Unified English Braille: Guidelines for Technical Material (2014)",
    locator: "7.1, p.34; 12.1, p.57",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    kinds: {
      "chemical-element": true, comparison: false, function: false,
      "general-fraction": true, group: true, modifier: false, negation: false,
      number: true, operation: false, radical: true, script: false,
      sequence: false, shape: true, "simple-arrow": true, "simple-fraction": true,
    },
    identifierPattern: "^\\p{L}\\p{M}*$",
  },
};

/** Accepted structured API inputs, not a normative list of chemical elements. */
export const TECHNICAL_VALUE_PATTERNS: TechnicalSignProgram["valuePatterns"] = {
  "chemical-element": "^[A-Z][a-z]?$",
  "function-name": "^\\p{L}[\\p{L}\\p{M}]*$",
  identifier: "^\\p{L}[\\p{L}\\p{M}\\d]*$",
  number: "^\\d+(?:[,.]\\d+)*$",
};

export interface TechnicalOperationSpacingSource {
  readonly international: TechnicalRuleSource<TechnicalSignProgram["operationSpacing"]["international"]>;
  readonly "bana-2026": {
    readonly citation: RuleCitation<
      "BANA", "Guidance on Transcribing Mathematics and Science in UEB (2026)",
      string, "https://brailleauthority.org/node/50"
    >;
    readonly definitions: TechnicalSignProgram["operationSpacing"]["bana-2026"];
  };
}

export const TECHNICAL_OPERATION_SPACING_RULES: TechnicalOperationSpacingSource = {
  international: {
    citation: {
      authority: "ICEB",
      document: "Unified English Braille: Guidelines for Technical Material (2014)",
      locator: "1.1.2, p.1 (caller-selected presentation)",
      url: "https://iceb.org/publications/ueb/",
    },
    definitions: { spaced: true, unspaced: false },
  },
  "bana-2026": {
    citation: {
      authority: "BANA",
      document: "Guidance on Transcribing Mathematics and Science in UEB (2026)",
      locator: "Introduction and 2 Spacing of signs, p.2 (agency-selected teaching presentation)",
      url: "https://brailleauthority.org/node/50",
    },
    definitions: { standardized: false, teaching: true },
  },
};

export interface TechnicalNumericContinuationSource {
  readonly citation: RuleCitation<
    "ICEB", "Guidelines for Technical Material: Grade 1 Indicators (July 2025)",
    string, "https://iceb.org/publications/ueb/"
  >;
  readonly definitions: TechnicalSignProgram["numericContinuation"];
}

export const TECHNICAL_NUMERIC_CONTINUATION_RULES: TechnicalNumericContinuationSource = {
  citation: {
    authority: "ICEB",
    document: "Guidelines for Technical Material: Grade 1 Indicators (July 2025)",
    locator: "1.7.2-1.7.3, pp.1-2 (numeric a-j exclusion)",
    url: "https://iceb.org/publications/ueb/",
  },
  definitions: {
    precedingKinds: ["number", "simple-fraction"],
    identifierPattern: "^[a-j]",
  },
};

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
  numericContinuation: TechnicalNumericContinuationSource,
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
  const additionalPrints = new Set(additional.map((rule) => rule.print));
  for (const source of [scripts, modifiers, shapes, delimiters, items, spacing.international, spacing["bana-2026"], numericContinuation]) {
    const authority = source.citation.authority;
    const officialHost = authority === "BANA" ? "https://brailleauthority.org/" : "https://iceb.org/";
    if (source.citation.locator.trim().length === 0 ||
      !source.citation.url.startsWith(officialHost)) {
      throw new Error(`Technical definitions lack an official ${authority} citation.`);
    }
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
    numericContinuation: {
      precedingKinds: [...numericContinuation.definitions.precedingKinds],
      identifierPattern: numericIdentifierPattern.source,
    },
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
