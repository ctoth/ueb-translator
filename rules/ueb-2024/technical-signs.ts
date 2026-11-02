import { loadSymbolProgram } from "../../src/symbol-program.js";
import { TECHNICAL_SCRIPT_PLACEMENTS, type TechnicalSignProgram } from "../../src/technical-program.js";
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

export interface TechnicalScriptSource {
  readonly citation: RuleCitation<
    "ICEB", "Unified English Braille: Guidelines for Technical Material (2014)",
    string, "https://iceb.org/publications/ueb/"
  >;
  readonly definitions: TechnicalSignProgram["scripts"];
}

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

export function compileTechnicalSigns(
  general: readonly SymbolRuleSource[],
  additional: readonly SymbolRuleSource[],
  mappings: Pick<TechnicalSignProgram, "operations" | "comparisons">,
  scripts: TechnicalScriptSource,
): TechnicalSignProgram {
  const compiled = compileSymbols([...general, ...additional]).runtime;
  const runtime = loadSymbolProgram(compiled);
  for (const print of [...Object.values(mappings.operations), ...Object.values(mappings.comparisons)]) {
    if (!runtime.symbols.has(print)) {
      throw new Error(`Technical sign references missing symbol ${JSON.stringify(print)}.`);
    }
  }
  const additionalPrints = new Set(additional.map((rule) => rule.print));
  if (scripts.citation.locator.trim().length === 0 ||
    !scripts.citation.url.startsWith("https://iceb.org/")) {
    throw new Error("Technical script definitions lack an official ICEB citation.");
  }
  for (const placement of TECHNICAL_SCRIPT_PLACEMENTS) {
    if (!/^[\u2800-\u28ff]+$/u.test(scripts.definitions[placement].indicator)) {
      throw new Error(`Technical script ${placement} has a malformed indicator.`);
    }
  }
  return {
    symbols: compiled.symbols.filter((symbol) => additionalPrints.has(symbol.print)),
    operations: { ...mappings.operations }, comparisons: { ...mappings.comparisons },
    scripts: { ...scripts.definitions },
  };
}
