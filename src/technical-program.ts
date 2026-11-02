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

export const TECHNICAL_SHAPE_NAMES = [
  "circle", "hexagon", "heptagon", "octagon", "parallelogram", "pentagon", "square", "triangle",
] as const;
export type TechnicalShapeName = (typeof TECHNICAL_SHAPE_NAMES)[number];

export const TECHNICAL_SHAPE_FILLS = ["filled", "outline", "shaded"] as const;
export type TechnicalShapeFill = (typeof TECHNICAL_SHAPE_FILLS)[number];

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

export const TECHNICAL_ENCLOSURES = ["absolute", "angle", "curly", "round", "square"] as const;
export type TechnicalEnclosure = (typeof TECHNICAL_ENCLOSURES)[number];
export const TECHNICAL_MATRIX_ENCLOSURES = ["curly", "determinant", "round", "square"] as const;
export const TECHNICAL_DELIMITER_SIGNS = [
  "groupOpen", "groupClose", "simpleFractionLine", "fractionOpen", "fractionLine",
  "fractionClose", "radicalOpen", "radicalClose",
] as const;
export interface TechnicalEnclosureCells {
  readonly open: string;
  readonly close: string;
}
export type TechnicalDelimiters = Readonly<Record<(typeof TECHNICAL_DELIMITER_SIGNS)[number], string>> & {
  readonly enclosures: Readonly<Record<TechnicalEnclosure, TechnicalEnclosureCells>>;
  readonly matrixEnclosures: Readonly<Record<(typeof TECHNICAL_MATRIX_ENCLOSURES)[number], TechnicalEnclosureCells>>;
};

/** Compiled symbols and descriptors for structured notation. */
export interface TechnicalSignProgram extends SymbolProgram {
  readonly operations: Readonly<Record<TechnicalOperation, string>>;
  readonly comparisons: Readonly<Record<TechnicalComparison, string>>;
  readonly scripts: Readonly<Record<TechnicalScriptPlacement, TechnicalScriptRule>>;
  readonly delimiters: TechnicalDelimiters;
  readonly modifiers: Readonly<Record<TechnicalModifier, string>>;
  readonly shapes: {
    readonly fills: Readonly<Record<TechnicalShapeFill, string>>;
    readonly names: Readonly<Record<TechnicalShapeName, string>>;
    readonly terminator: string;
  };
}
