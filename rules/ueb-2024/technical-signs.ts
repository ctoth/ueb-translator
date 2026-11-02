import { loadSymbolProgram } from "../../src/symbol-program.js";
import { TECHNICAL_MODIFIERS, TECHNICAL_SCRIPT_PLACEMENTS, TECHNICAL_SHAPE_FILLS, TECHNICAL_SHAPE_NAMES, type TechnicalEnclosure, type TechnicalSignProgram } from "../../src/technical-program.js";
import { citeTechnicalSign, type RuleCitation, type TechnicalSignLocator } from "./source.js";
import { compileSymbols, type SymbolRuleSource } from "./symbols/compiler.js";

/** ICEB October 2018 replacement Section 3, sign tables on pages 1-2. */
export const TECHNICAL_SIGN_MAPPINGS: Pick<TechnicalSignProgram, "operations" | "comparisons"> = {
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

export function compileTechnicalSigns(
  general: readonly SymbolRuleSource[],
  additional: readonly SymbolRuleSource[],
  mappings: Pick<TechnicalSignProgram, "operations" | "comparisons">,
  scripts: TechnicalScriptSource,
  modifiers: TechnicalModifierSource,
  shapes: TechnicalShapeSource,
  delimiters: TechnicalDelimiterSource,
): TechnicalSignProgram {
  const compiled = compileSymbols([...general, ...additional]).runtime;
  const runtime = loadSymbolProgram(compiled);
  for (const print of [...Object.values(mappings.operations), ...Object.values(mappings.comparisons)]) {
    if (!runtime.symbols.has(print)) {
      throw new Error(`Technical sign references missing symbol ${JSON.stringify(print)}.`);
    }
  }
  const additionalPrints = new Set(additional.map((rule) => rule.print));
  for (const source of [scripts, modifiers, shapes, delimiters]) {
    if (source.citation.locator.trim().length === 0 ||
      !source.citation.url.startsWith("https://iceb.org/")) {
      throw new Error("Technical definitions lack an official ICEB citation.");
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
    symbols: compiled.symbols.filter((symbol) => additionalPrints.has(symbol.print)),
    operations: { ...mappings.operations }, comparisons: { ...mappings.comparisons },
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
