import type { SymbolProgram } from "./symbol-program.js";

export const TECHNICAL_OPERATIONS = [
  "asterisk", "divide", "dot", "minus", "multiply", "plus", "plus-or-minus",
] as const;
export type TechnicalOperation = (typeof TECHNICAL_OPERATIONS)[number];

export const TECHNICAL_COMPARISONS = [
  "approximately-equal", "equals", "greater-than", "greater-than-or-equal",
  "less-than", "less-than-or-equal", "not-equal",
] as const;
export type TechnicalComparison = (typeof TECHNICAL_COMPARISONS)[number];

/** Additional symbols and semantic print references for structured notation. */
export interface TechnicalSignProgram extends SymbolProgram {
  readonly operations: Readonly<Record<TechnicalOperation, string>>;
  readonly comparisons: Readonly<Record<TechnicalComparison, string>>;
}
