import { loadSymbolProgram } from "../../src/symbol-program.js";
import type { TechnicalSignProgram } from "../../src/technical-program.js";
import { citeTechnicalSign, type TechnicalSignLocator } from "./source.js";
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

export function compileTechnicalSigns(
  general: readonly SymbolRuleSource[],
  additional: readonly SymbolRuleSource[],
  mappings: Pick<TechnicalSignProgram, "operations" | "comparisons">,
): TechnicalSignProgram {
  const compiled = compileSymbols([...general, ...additional]).runtime;
  const runtime = loadSymbolProgram(compiled);
  for (const print of [...Object.values(mappings.operations), ...Object.values(mappings.comparisons)]) {
    if (!runtime.symbols.has(print)) {
      throw new Error(`Technical sign references missing symbol ${JSON.stringify(print)}.`);
    }
  }
  const additionalPrints = new Set(additional.map((rule) => rule.print));
  return {
    symbols: compiled.symbols.filter((symbol) => additionalPrints.has(symbol.print)),
    operations: { ...mappings.operations }, comparisons: { ...mappings.comparisons },
  };
}
