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

export type TechnicalGrade1Policy = "all-technical" | "preferred";

export interface InternationalTechnicalProfile {
  readonly grade1: TechnicalGrade1Policy;
  readonly jurisdiction: "international";
  readonly operationSpacing: "spaced" | "unspaced";
}

export interface BanaTechnicalProfile {
  readonly grade1: TechnicalGrade1Policy;
  readonly jurisdiction: "bana-2026";
  readonly production: "standardized" | "teaching";
}

export type TechnicalProfile =
  | BanaTechnicalProfile
  | InternationalTechnicalProfile;

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

export interface TechnicalGrade1Protection {
  /** Ordered, first-match classification of accepted standing values. */
  readonly standingValues: readonly {
    readonly pattern: string;
    readonly flags: "u" | "iu";
    readonly kind: "standing-symbol" | "standing-word";
  }[];
  readonly maxSymbolsPerSequence: number;
  readonly passageSequenceThreshold: number;
}

export const TECHNICAL_EXPRESSION_KINDS: readonly TechnicalExpression["kind"][] = [
  "identifier", ...TECHNICAL_ITEM_KINDS,
];
type TechnicalInvalidValue =
  | (typeof TECHNICAL_VALUE_KINDS)[number] | "simple-fraction-denominator" | "simple-fraction-numerator";
const TECHNICAL_INVALID_VALUE_KINDS: readonly TechnicalInvalidValue[] = [
  ...TECHNICAL_VALUE_KINDS, "simple-fraction-denominator", "simple-fraction-numerator",
];
const TECHNICAL_WIDENED_KINDS = ["standing-symbol", "standing-word"] as const;

/** A path into the compiled program; `{ field }` steps read the expression. */
export type TechnicalSignPath = readonly (string | { readonly field: string })[];

export type TechnicalLayoutChild =
  | { readonly name: string; readonly render: "expression" | "script"; readonly field: string }
  | {
    readonly name: string;
    readonly render: "value";
    readonly field: string;
    readonly pattern: (typeof TECHNICAL_VALUE_KINDS)[number];
    readonly invalid: TechnicalInvalidValue;
    readonly standing: boolean;
  };

export type TechnicalLayoutPart =
  | {
    readonly child: string;
    readonly withoutNumericIndicator?: boolean;
    readonly widen?: readonly (typeof TECHNICAL_WIDENED_KINDS)[number][];
  }
  | { readonly sign: TechnicalSignPath; readonly require?: "symbol"; readonly requireCells?: number }
  | { readonly symbol: TechnicalSignPath; readonly require?: "symbol"; readonly requireCells?: number }
  | { readonly space: "always" | "operation" }
  | { readonly space: "letter"; readonly before: string };

export interface TechnicalLayoutCase {
  readonly children: readonly TechnicalLayoutChild[];
  readonly parts: readonly TechnicalLayoutPart[];
}

/** Print-to-Braille layout of one expression kind (GTM sections cited in the rule file). */
export type TechnicalLayout =
  | TechnicalLayoutCase
  | {
    readonly select: { readonly field: string } | { readonly sign: TechnicalSignPath };
    readonly cases: Readonly<Record<string, TechnicalLayoutCase>>;
  }
  | { readonly sequence: string };

export type TechnicalLayouts = Readonly<Record<TechnicalExpression["kind"], TechnicalLayout>>;

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMember<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

function hasOnly(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isSignPath(value: unknown): value is TechnicalSignPath {
  return Array.isArray(value) && value.length > 0 && value.every((step: unknown) =>
    typeof step === "string" ||
    (isObject(step) && hasOnly(step, ["field"]) && typeof step["field"] === "string"));
}

function isLayoutChild(value: unknown): value is TechnicalLayoutChild {
  if (!isObject(value) || typeof value["name"] !== "string" || typeof value["field"] !== "string") {
    return false;
  }
  if (value["render"] === "expression" || value["render"] === "script") {
    return hasOnly(value, ["name", "render", "field"]);
  }
  return value["render"] === "value" && hasOnly(value, ["name", "render", "field", "pattern", "invalid", "standing"]) &&
    isMember(TECHNICAL_VALUE_KINDS, value["pattern"]) &&
    isMember(TECHNICAL_INVALID_VALUE_KINDS, value["invalid"]) && typeof value["standing"] === "boolean";
}

function isRequirement(value: Readonly<Record<string, unknown>>): boolean {
  const cells = value["requireCells"];
  return (value["require"] === undefined || value["require"] === "symbol") &&
    (cells === undefined || (value["require"] === "symbol" && Number.isSafeInteger(cells) && Number(cells) > 0));
}

function isLayoutPart(value: unknown, children: readonly string[]): value is TechnicalLayoutPart {
  if (!isObject(value)) return false;
  if ("child" in value) {
    const widen = value["widen"];
    return hasOnly(value, ["child", "withoutNumericIndicator", "widen"]) &&
      isMember(children, value["child"]) &&
      (value["withoutNumericIndicator"] === undefined || value["withoutNumericIndicator"] === true) &&
      (widen === undefined || (Array.isArray(widen) &&
        widen.every((kind: unknown) => isMember(TECHNICAL_WIDENED_KINDS, kind))));
  }
  if ("sign" in value || "symbol" in value) {
    return hasOnly(value, ["sign", "symbol", "require", "requireCells"]) &&
      ("sign" in value !== "symbol" in value) &&
      isSignPath(value["sign"] ?? value["symbol"]) && isRequirement(value);
  }
  if (value["space"] === "letter") {
    return hasOnly(value, ["space", "before"]) && isMember(children, value["before"]);
  }
  return hasOnly(value, ["space"]) && (value["space"] === "always" || value["space"] === "operation");
}

function isLayoutCase(value: unknown): value is TechnicalLayoutCase {
  if (!isObject(value) || !hasOnly(value, ["children", "parts"])) return false;
  const children = value["children"];
  const parts = value["parts"];
  if (!Array.isArray(children) || !children.every(isLayoutChild) || !Array.isArray(parts)) return false;
  const names = children.map((child) => child.name);
  return new Set(names).size === names.length && parts.length > 0 &&
    parts.every((part: unknown) => isLayoutPart(part, names));
}

function isLayout(value: unknown): value is TechnicalLayout {
  if (!isObject(value)) return false;
  if ("sequence" in value) return hasOnly(value, ["sequence"]) && typeof value["sequence"] === "string";
  if (!("select" in value)) return isLayoutCase(value);
  const select = value["select"];
  const cases = value["cases"];
  return hasOnly(value, ["select", "cases"]) && isObject(select) && hasOnly(select, ["field", "sign"]) &&
    ("field" in select !== "sign" in select) &&
    (typeof select["field"] === "string" || isSignPath(select["sign"])) &&
    isObject(cases) && Object.keys(cases).length > 0 && Object.values(cases).every(isLayoutCase);
}

/** One layout per expression kind, each well formed. */
export function isTechnicalLayouts(value: unknown): value is TechnicalLayouts {
  return isObject(value) && hasOnly(value, TECHNICAL_EXPRESSION_KINDS) &&
    TECHNICAL_EXPRESSION_KINDS.every((kind) => isLayout(value[kind]));
}

/** Compiled symbols and descriptors for structured notation. */
export interface TechnicalSignProgram extends SymbolProgram {
  readonly layouts: TechnicalLayouts;
  readonly computerWhitespace: {
    readonly visibleSpace: string;
    readonly minimumRunLength: number;
    readonly ordinaryEdgeLength: number;
  };
  readonly numericContinuation: {
    readonly precedingKinds: readonly TechnicalExpression["kind"][];
    /** Case-sensitive Unicode pattern for the raw identifier prefix. */
    readonly identifierPattern: string;
  };
  readonly functionSpacing: {
    readonly letterCells: readonly string[];
    /** Function names matched with Unicode semantics. */
    readonly namePattern: string;
  };
  readonly grade1Protection: TechnicalGrade1Protection;
  readonly operationSpacing: {
    readonly international: Readonly<Record<InternationalTechnicalProfile["operationSpacing"], boolean>>;
    readonly "bana-2026": Readonly<Record<BanaTechnicalProfile["production"], boolean>>;
  };
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
