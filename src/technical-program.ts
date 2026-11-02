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

export const TECHNICAL_SCRIPT_PLACEMENTS = [
  "directly-above", "directly-below", "left-subscript", "left-superscript",
  "right-subscript", "right-superscript",
] as const;
export type TechnicalScriptPlacement = (typeof TECHNICAL_SCRIPT_PLACEMENTS)[number];

export const TECHNICAL_MODIFIERS = [
  "arc-above", "bar-above", "bar-below", "dot-above", "dot-below",
  "hat-above", "hat-below", "line-through", "right-arrow-above",
  "right-arrow-below", "tilde-above", "tilde-below",
] as const;
export type TechnicalModifier = (typeof TECHNICAL_MODIFIERS)[number];

export interface TechnicalScriptRule {
  readonly indicator: string;
  readonly position: "before" | "after";
}

/** Compiled symbols and descriptors for structured notation. */
export interface TechnicalSignProgram extends SymbolProgram {
  readonly operations: Readonly<Record<TechnicalOperation, string>>;
  readonly comparisons: Readonly<Record<TechnicalComparison, string>>;
  readonly scripts: Readonly<Record<TechnicalScriptPlacement, TechnicalScriptRule>>;
  readonly modifiers: Readonly<Record<TechnicalModifier, string>>;
}
