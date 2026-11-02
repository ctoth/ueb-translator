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

export const TECHNICAL_ARROW_DIRECTIONS = [
  "down", "down-left", "down-right", "left", "right", "up", "up-left", "up-right",
] as const;
export type SimpleArrowDirection = (typeof TECHNICAL_ARROW_DIRECTIONS)[number];

export interface TechnicalIdentifier {
  readonly kind: "identifier";
  readonly value: string;
}

export interface TechnicalNumber {
  readonly kind: "number";
  readonly value: string;
}

export interface TechnicalSequence {
  readonly items: readonly TechnicalExpression[];
  readonly kind: "sequence";
}

export interface TechnicalOperationExpression {
  readonly kind: "operation";
  readonly left: TechnicalExpression;
  readonly operation: TechnicalOperation;
  readonly right: TechnicalExpression;
}

export interface TechnicalComparisonExpression {
  readonly comparison: TechnicalComparison;
  readonly kind: "comparison";
  readonly left: TechnicalExpression;
  readonly right: TechnicalExpression;
}

export interface TechnicalNegation {
  readonly kind: "negation";
  readonly operand: TechnicalExpression;
}

export interface TechnicalSimpleFraction {
  readonly denominator: string;
  readonly kind: "simple-fraction";
  readonly numerator: string;
}

export interface TechnicalGeneralFraction {
  readonly denominator: TechnicalExpression;
  readonly kind: "general-fraction";
  readonly numerator: TechnicalExpression;
}

export interface TechnicalScript {
  readonly base: TechnicalExpression;
  readonly kind: "script";
  readonly placement: TechnicalScriptPlacement;
  readonly script: TechnicalExpression;
}

export interface TechnicalSquareRoot {
  readonly kind: "radical";
  readonly radicand: TechnicalExpression;
  readonly root: "square";
}

export interface TechnicalIndexedRoot {
  readonly index: TechnicalExpression;
  readonly kind: "radical";
  readonly radicand: TechnicalExpression;
  readonly root: "indexed";
}

export type TechnicalRadical = TechnicalIndexedRoot | TechnicalSquareRoot;

export interface TechnicalSimpleArrow {
  readonly direction: SimpleArrowDirection;
  readonly kind: "simple-arrow";
}

export interface TechnicalChemicalElement {
  readonly kind: "chemical-element";
  readonly symbol: string;
}

export interface TechnicalGroup {
  readonly content: TechnicalExpression;
  readonly enclosure: TechnicalEnclosure;
  readonly kind: "group";
}

export interface TechnicalFunction {
  readonly argument: TechnicalExpression;
  readonly kind: "function";
  readonly name: string;
}

export interface TechnicalModifiedItem {
  readonly item: TechnicalExpression;
  readonly kind: "modifier";
  readonly modifier: TechnicalModifier;
}

export interface TechnicalShape {
  readonly fill: TechnicalShapeFill;
  readonly kind: "shape";
  readonly shape: TechnicalShapeName;
  readonly terminator: "omitted" | "present";
}

export type TechnicalExpression =
  | TechnicalChemicalElement
  | TechnicalComparisonExpression
  | TechnicalGeneralFraction
  | TechnicalGroup
  | TechnicalIdentifier
  | TechnicalFunction
  | TechnicalModifiedItem
  | TechnicalNegation
  | TechnicalNumber
  | TechnicalOperationExpression
  | TechnicalRadical
  | TechnicalScript
  | TechnicalSequence
  | TechnicalShape
  | TechnicalSimpleArrow
  | TechnicalSimpleFraction;

export const TECHNICAL_ITEM_KINDS = [
  "chemical-element", "comparison", "function", "general-fraction", "group",
  "modifier", "negation", "number", "operation", "radical", "script", "sequence",
  "shape", "simple-arrow", "simple-fraction",
] as const;

export interface TechnicalItemPolicy {
  readonly kinds: Readonly<Record<Exclude<TechnicalExpression["kind"], "identifier">, boolean>>;
  /** Unicode pattern for the identifier value, matched with Unicode semantics. */
  readonly identifierPattern: string;
}

export const TECHNICAL_VALUE_KINDS = ["chemical-element", "function-name", "identifier", "number"] as const;

/** Compiled symbols and descriptors for structured notation. */
export interface TechnicalSignProgram extends SymbolProgram {
  readonly itemPolicy: TechnicalItemPolicy;
  /** Accepted API input grammars, matched with Unicode semantics. */
  readonly valuePatterns: Readonly<Record<(typeof TECHNICAL_VALUE_KINDS)[number], string>>;
  readonly operations: Readonly<Record<TechnicalOperation, string>>;
  readonly comparisons: Readonly<Record<TechnicalComparison, string>>;
  readonly arrows: Readonly<Record<SimpleArrowDirection, string>>;
  readonly scripts: Readonly<Record<TechnicalScriptPlacement, TechnicalScriptRule>>;
  readonly delimiters: TechnicalDelimiters;
  readonly modifiers: Readonly<Record<TechnicalModifier, string>>;
  readonly shapes: {
    readonly fills: Readonly<Record<TechnicalShapeFill, string>>;
    readonly names: Readonly<Record<TechnicalShapeName, string>>;
    readonly terminator: string;
  };
}
