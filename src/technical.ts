/**
 * Structured Unified English Braille technical translation.
 *
 * Normative sources: ICEB Guidelines for Technical Material (2014), its
 * errata, replacement Section 3 (2018), and replacement Section 1.7 (2025).
 * The optional BANA profile applies the May 2026 regional guidance without
 * changing ICEB sign mappings.
 */

import {
  translateGrade1,
  type Grade1TextResult,
} from "./grade1.js";
import type { Grade2TextResult } from "./grade2.js";

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

export type TechnicalOperation =
  | "asterisk"
  | "divide"
  | "dot"
  | "minus"
  | "multiply"
  | "plus"
  | "plus-or-minus";

export type TechnicalComparison =
  | "approximately-equal"
  | "equals"
  | "greater-than"
  | "greater-than-or-equal"
  | "less-than"
  | "less-than-or-equal"
  | "not-equal";

export type TechnicalScriptPlacement =
  | "directly-above"
  | "directly-below"
  | "left-subscript"
  | "left-superscript"
  | "right-subscript"
  | "right-superscript";

export type SimpleArrowDirection =
  | "down"
  | "down-left"
  | "down-right"
  | "left"
  | "right"
  | "up"
  | "up-left"
  | "up-right";

export type TechnicalEnclosure =
  | "absolute"
  | "angle"
  | "curly"
  | "round"
  | "square";

export type TechnicalModifier =
  | "arc-above"
  | "bar-above"
  | "bar-below"
  | "dot-above"
  | "dot-below"
  | "hat-above"
  | "hat-below"
  | "line-through"
  | "right-arrow-above"
  | "right-arrow-below"
  | "tilde-above"
  | "tilde-below";

export type TechnicalShapeName =
  | "circle"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "parallelogram"
  | "pentagon"
  | "square"
  | "triangle";

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
  readonly fill: "filled" | "outline" | "shaded";
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

export interface TechnicalExpressionBlock {
  readonly expression: TechnicalExpression;
  readonly kind: "expression";
}

interface TechnicalComputerBlockBase {
  readonly kind: "computer";
  readonly lines: readonly string[];
  readonly spacing: "ordinary" | "significant";
}

export interface TechnicalGrade1ComputerBlock
  extends TechnicalComputerBlockBase {
  readonly grade: "grade1";
}

export interface TechnicalGrade2ComputerBlock
  extends TechnicalComputerBlockBase {
  readonly grade: "grade2";
  readonly translator: (input: string) => Grade2TextResult;
}

export type TechnicalComputerBlock =
  | TechnicalGrade1ComputerBlock
  | TechnicalGrade2ComputerBlock;

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];

export interface TechnicalMatrixBlock {
  readonly columnGap: 1 | 2;
  readonly enclosure: "curly" | "determinant" | "round" | "square";
  readonly kind: "matrix";
  readonly rows: NonEmptyReadonlyArray<
    NonEmptyReadonlyArray<TechnicalExpression>
  >;
}

export type TechnicalBlock =
  | TechnicalComputerBlock
  | TechnicalExpressionBlock
  | TechnicalMatrixBlock;

export interface TechnicalDocument {
  readonly blocks: readonly TechnicalBlock[];
  readonly kind: "technical-document";
  readonly profile: TechnicalProfile;
}

export interface TechnicalTextInput {
  readonly kind: "technical-text";
  readonly text: string;
}

export type TechnicalInput = TechnicalDocument | TechnicalTextInput;

export interface TechnicalSuccess {
  readonly braille: string;
  readonly mode: "technical";
  readonly ok: true;
}

export interface TechnicalTextSuccess {
  readonly braille: string;
  readonly mode: "technical-text";
  readonly ok: true;
}

export type TechnicalInvalidValueKind =
  | "chemical-element"
  | "function-name"
  | "identifier"
  | "number"
  | "simple-fraction-denominator"
  | "simple-fraction-numerator";

export interface TechnicalInvalidValue {
  readonly kind: TechnicalInvalidValueKind;
  readonly mode: "technical";
  readonly ok: false;
  readonly reason: "invalid-value";
  readonly value: string;
}

export interface TechnicalUnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "technical";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export interface TechnicalInvalidBoundary {
  readonly at: number;
  readonly mode: "technical";
  readonly ok: false;
  readonly reason: "invalid-boundary";
  readonly runIndex: number;
}

export interface TechnicalRaggedMatrix {
  readonly actualColumns: number;
  readonly expectedColumns: number;
  readonly mode: "technical";
  readonly ok: false;
  readonly reason: "ragged-matrix";
  readonly rowIndex: number;
}

export interface TechnicalTextUnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "technical-text";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export type TechnicalFailure =
  | TechnicalInvalidBoundary
  | TechnicalInvalidValue
  | TechnicalRaggedMatrix
  | TechnicalUnsupportedCharacter;

export type TechnicalResult = TechnicalFailure | TechnicalSuccess;

export type TechnicalTextResult =
  | TechnicalTextSuccess
  | TechnicalTextUnsupportedCharacter;

interface RenderSuccess {
  readonly braille: string;
  readonly ok: true;
  readonly requirements: readonly Grade1Requirement[];
}

type RenderResult = RenderSuccess | TechnicalFailure;

function renderSuccess(
  braille: string,
  requirements: readonly Grade1Requirement[] = [],
): RenderSuccess {
  return { braille, ok: true, requirements };
}

const BRAILLE_SPACE = "⠀";
const GRADE1_SYMBOL_INDICATOR = "⠰";
const GRADE1_WORD_INDICATOR = "⠰⠰";
const GRADE1_PASSAGE_INDICATOR = "⠰⠰⠰";
const GRADE1_TERMINATOR = "⠰⠄";
const BRAILLE_GROUP_OPEN = "⠣";
const BRAILLE_GROUP_CLOSE = "⠜";
const GENERAL_FRACTION_OPEN = "⠷";
const SIMPLE_NUMERIC_FRACTION_LINE = "⠌";
const GENERAL_FRACTION_LINE = "⠨⠌";
const GENERAL_FRACTION_CLOSE = "⠾";
const RADICAL_OPEN = "⠩";
const RADICAL_CLOSE = "⠬";
const MATHEMATICAL_MINUS = "⠐⠤";
const SHAPE_TERMINATOR = "⠱";
const VISIBLE_SPACE = "⠬";

interface EnclosureCells {
  readonly close: string;
  readonly open: string;
}

const OPERATION_CELLS = {
  asterisk: "⠐⠔",
  divide: "⠐⠌",
  dot: "⠐⠲",
  minus: MATHEMATICAL_MINUS,
  multiply: "⠐⠦",
  plus: "⠐⠖",
  "plus-or-minus": "⠸⠖",
} satisfies Readonly<Record<TechnicalOperation, string>>;

const COMPARISON_CELLS = {
  "approximately-equal": "⠸⠔",
  equals: "⠐⠶",
  "greater-than": "⠈⠜",
  "greater-than-or-equal": "⠸⠈⠜",
  "less-than": "⠈⠣",
  "less-than-or-equal": "⠸⠈⠣",
  "not-equal": "⠐⠶⠈⠱",
} satisfies Readonly<Record<TechnicalComparison, string>>;

const SCRIPT_INDICATORS = {
  "directly-above": "⠨⠔",
  "directly-below": "⠨⠢",
  "left-subscript": "⠢",
  "left-superscript": "⠔",
  "right-subscript": "⠢",
  "right-superscript": "⠔",
} satisfies Readonly<Record<TechnicalScriptPlacement, string>>;

const ARROW_TERMINATORS = {
  down: "⠩",
  "down-left": "⠜",
  "down-right": "⠣",
  left: "⠪",
  right: "⠕",
  up: "⠬",
  "up-left": "⠱",
  "up-right": "⠎",
} satisfies Readonly<Record<SimpleArrowDirection, string>>;

const ENCLOSURE_CELLS = {
  absolute: { close: "⠸⠳", open: "⠸⠳" },
  angle: { close: "⠈⠜", open: "⠈⠣" },
  curly: { close: "⠸⠜", open: "⠸⠣" },
  round: { close: "⠐⠜", open: "⠐⠣" },
  square: { close: "⠨⠜", open: "⠨⠣" },
} satisfies Readonly<Record<TechnicalEnclosure, EnclosureCells>>;

const MODIFIER_CELLS = {
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
} satisfies Readonly<Record<TechnicalModifier, string>>;

function operationCell(operation: TechnicalOperation): string {
  return OPERATION_CELLS[operation];
}

function comparisonCell(comparison: TechnicalComparison): string {
  return COMPARISON_CELLS[comparison];
}

function scriptIndicator(placement: TechnicalScriptPlacement): string {
  return SCRIPT_INDICATORS[placement];
}

function arrowTerminator(direction: SimpleArrowDirection): string {
  return ARROW_TERMINATORS[direction];
}

function enclosureCells(enclosure: TechnicalEnclosure): EnclosureCells {
  return ENCLOSURE_CELLS[enclosure];
}

function modifierCell(modifier: TechnicalModifier): string {
  return MODIFIER_CELLS[modifier];
}

const SHAPE_FILL_CELLS = {
  filled: "⠸⠫",
  outline: "⠫",
  shaded: "⠨⠫",
} satisfies Readonly<Record<TechnicalShape["fill"], string>>;

const SHAPE_NAME_CELLS = {
  circle: "⠿",
  hexagon: "⠼⠋",
  heptagon: "⠼⠛",
  octagon: "⠼⠓",
  parallelogram: "⠈⠼⠙",
  pentagon: "⠼⠑",
  square: "⠼⠙",
  triangle: "⠼⠉",
} satisfies Readonly<Record<TechnicalShapeName, string>>;

function shapeCell(shape: TechnicalShape): string {
  const braille = `${SHAPE_FILL_CELLS[shape.fill]}${SHAPE_NAME_CELLS[shape.shape]}`;
  return shape.terminator === "present"
    ? `${braille}${SHAPE_TERMINATOR}`
    : braille;
}

function renderPrintValue(
  value: string,
  kind: TechnicalInvalidValueKind,
  pattern: RegExp,
): RenderResult {
  if (!pattern.test(value)) {
    return { kind, mode: "technical", ok: false, reason: "invalid-value", value };
  }
  const translated = translateGrade1(value);
  if (!translated.ok) {
    return { ...translated, mode: "technical" };
  }
  return renderSuccess(translated.braille);
}

function renderNumber(value: string): RenderResult {
  return renderPrintValue(value, "number", /^\d+(?:[,.]\d+)*$/u);
}

function isOneItem(expression: TechnicalExpression): boolean {
  switch (expression.kind) {
    case "chemical-element":
    case "general-fraction":
    case "group":
    case "identifier":
    case "number":
    case "radical":
    case "simple-arrow":
    case "simple-fraction":
    case "shape":
      return true;
    case "comparison":
    case "negation":
    case "operation":
    case "sequence":
    case "function":
      return false;
    case "modifier":
      return isOneItem(expression.item);
    case "script":
      return isOneItem(expression.base);
  }
}

function renderScriptValue(
  expression: TechnicalExpression,
  profile: TechnicalProfile,
): RenderResult {
  const rendered = renderExpression(expression, profile);
  if (!rendered.ok) {
    return rendered;
  }
  if (isOneItem(expression)) {
    return rendered;
  }
  return renderSuccess(
    `${BRAILLE_GROUP_OPEN}${rendered.braille}${BRAILLE_GROUP_CLOSE}`,
    shiftRequirements(rendered.requirements, BRAILLE_GROUP_OPEN.length),
  );
}

function operationIsSpaced(profile: TechnicalProfile): boolean {
  switch (profile.jurisdiction) {
    case "bana-2026":
      return profile.production === "teaching";
    case "international":
      return profile.operationSpacing === "spaced";
  }
}

function joinRendered(results: readonly RenderResult[]): RenderResult {
  let braille = "";
  const requirements: Grade1Requirement[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    requirements.push(...shiftRequirements(result.requirements, braille.length));
    braille += result.braille;
  }
  return renderSuccess(braille, requirements);
}

function renderExpression(
  expression: TechnicalExpression,
  profile: TechnicalProfile,
): RenderResult {
  switch (expression.kind) {
    case "chemical-element":
      return renderPrintValue(
        expression.symbol,
        "chemical-element",
        /^[A-Z][a-z]?$/u,
      );
    case "comparison": {
      const left = renderExpression(expression.left, profile);
      const right = renderExpression(expression.right, profile);
      if (!left.ok) {
        return left;
      }
      if (!right.ok) {
        return right;
      }
      const rightOffset =
        left.braille.length + comparisonCell(expression.comparison).length + 2;
      return renderSuccess(
        `${left.braille}${BRAILLE_SPACE}${comparisonCell(expression.comparison)}${BRAILLE_SPACE}${right.braille}`,
        [
          ...left.requirements,
          ...shiftRequirements(right.requirements, rightOffset),
        ],
      );
    }
    case "general-fraction": {
      const numerator = renderExpression(expression.numerator, profile);
      const denominator = renderExpression(expression.denominator, profile);
      if (!numerator.ok) {
        return numerator;
      }
      if (!denominator.ok) {
        return denominator;
      }
      const denominatorOffset =
        GENERAL_FRACTION_OPEN.length +
        numerator.braille.length +
        GENERAL_FRACTION_LINE.length;
      return renderSuccess(
        `${GENERAL_FRACTION_OPEN}${numerator.braille}${GENERAL_FRACTION_LINE}${denominator.braille}${GENERAL_FRACTION_CLOSE}`,
        [
          { end: GENERAL_FRACTION_OPEN.length, kind: "symbol", offset: 0 },
          ...shiftRequirements(
            numerator.requirements,
            GENERAL_FRACTION_OPEN.length,
          ),
          ...shiftRequirements(denominator.requirements, denominatorOffset),
        ],
      );
    }
    case "group": {
      const content = renderExpression(expression.content, profile);
      if (!content.ok) {
        return content;
      }
      const enclosure = enclosureCells(expression.enclosure);
      return renderSuccess(
        `${enclosure.open}${content.braille}${enclosure.close}`,
        shiftRequirements(content.requirements, enclosure.open.length),
      );
    }
    case "identifier": {
      const rendered = renderPrintValue(
        expression.value,
        "identifier",
        /^\p{L}[\p{L}\p{M}\d]*$/u,
      );
      if (!rendered.ok) {
        return rendered;
      }
      if (/^[b-hj-np-z]$/u.test(expression.value)) {
        return renderSuccess(rendered.braille, [
          {
            end: rendered.braille.length,
            kind: "standing-symbol",
            offset: 0,
          },
        ]);
      }
      if (/^\p{L}[\p{L}\p{M}\d]+$/u.test(expression.value)) {
        return renderSuccess(rendered.braille, [
          {
            end: rendered.braille.length,
            kind: "standing-word",
            offset: 0,
          },
        ]);
      }
      return rendered;
    }
    case "function": {
      const name = renderPrintValue(
        expression.name,
        "function-name",
        /^\p{L}[\p{L}\p{M}]*$/u,
      );
      const argument = renderExpression(expression.argument, profile);
      if (!name.ok) {
        return name;
      }
      if (!argument.ok) {
        return argument;
      }
      const space =
        expression.argument.kind === "identifier" &&
        /^\p{Ll}/u.test(expression.argument.value)
          ? BRAILLE_SPACE
          : "";
      return renderSuccess(
        `${name.braille}${space}${argument.braille}`,
        shiftRequirements(
          argument.requirements,
          name.braille.length + space.length,
        ),
      );
    }
    case "modifier": {
      const item = renderExpression(expression.item, profile);
      if (!item.ok) {
        return item;
      }
      const modifier = modifierCell(expression.modifier);
      return renderSuccess(`${item.braille}${modifier}`, [
        ...item.requirements,
        {
          end: item.braille.length + modifier.length,
          kind: "symbol",
          offset: item.braille.length,
        },
      ]);
    }
    case "negation": {
      const operand = renderExpression(expression.operand, profile);
      if (!operand.ok) {
        return operand;
      }
      return renderSuccess(
        `${MATHEMATICAL_MINUS}${operand.braille}`,
        shiftRequirements(operand.requirements, MATHEMATICAL_MINUS.length),
      );
    }
    case "number":
      return renderNumber(expression.value);
    case "operation": {
      const left = renderExpression(expression.left, profile);
      const right = renderExpression(expression.right, profile);
      if (!left.ok) {
        return left;
      }
      if (!right.ok) {
        return right;
      }
      const space = operationIsSpaced(profile) ? BRAILLE_SPACE : "";
      const rightOffset =
        left.braille.length +
        operationCell(expression.operation).length +
        space.length * 2;
      return renderSuccess(
        `${left.braille}${space}${operationCell(expression.operation)}${space}${right.braille}`,
        [
          ...left.requirements,
          ...shiftRequirements(right.requirements, rightOffset),
        ],
      );
    }
    case "radical": {
      const radicand = renderExpression(expression.radicand, profile);
      if (!radicand.ok) {
        return radicand;
      }
      if (expression.root === "square") {
        const braille = `${RADICAL_OPEN}${radicand.braille}${RADICAL_CLOSE}`;
        return renderSuccess(braille, [
          { end: RADICAL_OPEN.length, kind: "symbol", offset: 0 },
          ...shiftRequirements(radicand.requirements, RADICAL_OPEN.length),
          {
            end: braille.length,
            kind: "symbol",
            offset: braille.length - RADICAL_CLOSE.length,
          },
        ]);
      }
      const index = renderScriptValue(expression.index, profile);
      if (!index.ok) {
        return index;
      }
      const indexOffset = RADICAL_OPEN.length + 1;
      const radicandOffset = indexOffset + index.braille.length;
      const braille = `${RADICAL_OPEN}⠔${index.braille}${radicand.braille}${RADICAL_CLOSE}`;
      return renderSuccess(braille, [
        { end: RADICAL_OPEN.length, kind: "symbol", offset: 0 },
        { end: indexOffset, kind: "symbol", offset: RADICAL_OPEN.length },
        ...shiftRequirements(index.requirements, indexOffset),
        ...shiftRequirements(radicand.requirements, radicandOffset),
        {
          end: braille.length,
          kind: "symbol",
          offset: braille.length - RADICAL_CLOSE.length,
        },
      ]);
    }
    case "script": {
      const base = renderExpression(expression.base, profile);
      const script = renderScriptValue(expression.script, profile);
      if (!base.ok) {
        return base;
      }
      if (!script.ok) {
        return script;
      }
      const indicator = scriptIndicator(expression.placement);
      const rendered = `${indicator}${script.braille}`;
      if (
        expression.placement === "left-subscript" ||
        expression.placement === "left-superscript"
      ) {
        return renderSuccess(`${rendered}${base.braille}`, [
          { end: indicator.length, kind: "symbol", offset: 0 },
          ...shiftRequirements(script.requirements, indicator.length),
          ...shiftRequirements(
            base.requirements,
            indicator.length + script.braille.length,
          ),
        ]);
      }
      return renderSuccess(`${base.braille}${rendered}`, [
        ...base.requirements,
        {
          end: base.braille.length + indicator.length,
          kind: "symbol",
          offset: base.braille.length,
        },
        ...shiftRequirements(
          script.requirements,
          base.braille.length + indicator.length,
        ),
      ]);
    }
    case "sequence": {
      let braille = "";
      const requirements: Grade1Requirement[] = [];
      let offset = 0;
      let previous: TechnicalExpression | undefined;
      for (const item of expression.items) {
        const itemRendered = renderExpression(item, profile);
        if (!itemRendered.ok) {
          return itemRendered;
        }
        requirements.push(
          ...shiftRequirements(itemRendered.requirements, offset),
        );
        if (
          (previous?.kind === "number" ||
            previous?.kind === "simple-fraction") &&
          item.kind === "identifier" &&
          /^[a-j]/u.test(item.value)
        ) {
          requirements.push({
            end: offset + 1,
            kind: "numeric-symbol",
            offset,
          });
        }
        braille += itemRendered.braille;
        offset += itemRendered.braille.length;
        previous = item;
      }
      return renderSuccess(braille, requirements);
    }
    case "shape":
      return renderSuccess(shapeCell(expression), [
        { end: 1, kind: "symbol", offset: 0 },
      ]);
    case "simple-arrow":
      return renderSuccess(`⠳${arrowTerminator(expression.direction)}`, [
        { end: 1, kind: "symbol", offset: 0 },
      ]);
    case "simple-fraction": {
      const numerator = renderPrintValue(
        expression.numerator,
        "simple-fraction-numerator",
        /^\d+(?:[,.]\d+)*$/u,
      );
      const denominator = renderPrintValue(
        expression.denominator,
        "simple-fraction-denominator",
        /^\d+(?:[,.]\d+)*$/u,
      );
      if (!numerator.ok) {
        return numerator;
      }
      if (!denominator.ok) {
        return denominator;
      }
      return renderSuccess(
        `${numerator.braille}${SIMPLE_NUMERIC_FRACTION_LINE}${denominator.braille.slice(1)}`,
      );
    }
  }
}

function translateComputerPrint(
  text: string,
  translator: (input: string) => Grade1TextResult | Grade2TextResult,
  codeUnitOffset: number,
  scalarOffset: number,
): RenderResult {
  const translated = translator(text);
  if (translated.ok) {
    return renderSuccess(translated.braille);
  }
  return {
    ...translated,
    codeUnitIndex: codeUnitOffset + translated.codeUnitIndex,
    mode: "technical",
    scalarIndex: scalarOffset + translated.scalarIndex,
  };
}

function renderSignificantComputerLine(
  line: string,
  translator: (input: string) => Grade1TextResult | Grade2TextResult,
): RenderResult {
  let braille = "";
  let cursor = 0;
  while (cursor < line.length) {
    if (line.charAt(cursor) === " ") {
      let end = cursor + 1;
      while (line.charAt(end) === " ") {
        end += 1;
      }
      const count = end - cursor;
      if (count >= 3) {
        braille += `${BRAILLE_SPACE}${VISIBLE_SPACE.repeat(count - 2)}${BRAILLE_SPACE}`;
      } else {
        braille += BRAILLE_SPACE.repeat(count);
      }
      cursor = end;
      continue;
    }
    let end = cursor + 1;
    while (end < line.length && line.charAt(end) !== " ") {
      end += 1;
    }
    const fragment = line.slice(cursor, end);
    const translated = translateComputerPrint(
      fragment,
      translator,
      cursor,
      Array.from(line.slice(0, cursor)).length,
    );
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    cursor = end;
  }
  return renderSuccess(braille);
}

function renderComputer(block: TechnicalComputerBlock): RenderResult {
  const translator =
    block.grade === "grade1" ? translateGrade1 : block.translator;
  const translatedLines: string[] = [];
  for (const line of block.lines) {
    const translated =
      block.spacing === "significant"
        ? renderSignificantComputerLine(line, translator)
        : translateComputerPrint(line, translator, 0, 0);
    if (!translated.ok) {
      return translated;
    }
    translatedLines.push(translated.braille);
  }
  return renderSuccess(translatedLines.join("\n"));
}

const MATRIX_ENCLOSURE_CELLS = {
  curly: { close: "⠠⠸⠜", open: "⠠⠸⠣" },
  determinant: { close: "⠠⠸⠳", open: "⠠⠸⠳" },
  round: { close: "⠠⠐⠜", open: "⠠⠐⠣" },
  square: { close: "⠠⠨⠜", open: "⠠⠨⠣" },
} satisfies Readonly<
  Record<TechnicalMatrixBlock["enclosure"], EnclosureCells>
>;

function matrixEnclosureCells(
  enclosure: TechnicalMatrixBlock["enclosure"],
): EnclosureCells {
  return MATRIX_ENCLOSURE_CELLS[enclosure];
}

function renderMatrix(
  block: TechnicalMatrixBlock,
  profile: TechnicalProfile,
): RenderResult {
  const expectedColumns = block.rows[0].length;
  const enclosure = matrixEnclosureCells(block.enclosure);
  const gap = BRAILLE_SPACE.repeat(block.columnGap);
  const renderedRows: string[] = [];
  for (const [rowIndex, row] of block.rows.entries()) {
    if (row.length !== expectedColumns) {
      return {
        actualColumns: row.length,
        expectedColumns,
        mode: "technical",
        ok: false,
        reason: "ragged-matrix",
        rowIndex,
      };
    }
    const cells: string[] = [];
    for (const expression of row) {
      const rendered = renderExpression(expression, profile);
      if (!rendered.ok) {
        return rendered;
      }
      cells.push(rendered.braille);
    }
    renderedRows.push(
      `${enclosure.open}${cells.join(gap)}${enclosure.close}`,
    );
  }
  return renderSuccess(
    `${GRADE1_PASSAGE_INDICATOR}${renderedRows.join("\n")}${GRADE1_TERMINATOR}`,
  );
}

type Grade1RequirementKind =
  | "numeric-symbol"
  | "standing-symbol"
  | "standing-word"
  | "symbol";

interface Grade1Requirement {
  readonly end: number;
  readonly kind: Grade1RequirementKind;
  readonly offset: number;
}

interface SymbolsSequence {
  readonly end: number;
  readonly start: number;
}

interface Grade1Insertion {
  readonly indicator: typeof GRADE1_SYMBOL_INDICATOR | typeof GRADE1_WORD_INDICATOR;
  readonly offset: number;
}

function shiftRequirements(
  requirements: readonly Grade1Requirement[],
  offset: number,
): readonly Grade1Requirement[] {
  return requirements.map((requirement) => ({
    end: requirement.end + offset,
    kind: requirement.kind,
    offset: requirement.offset + offset,
  }));
}

function symbolsSequences(braille: string): readonly SymbolsSequence[] {
  const sequences: SymbolsSequence[] = [];
  let start = 0;
  for (let index = 0; index <= braille.length; index += 1) {
    if (index === braille.length || braille.charAt(index) === BRAILLE_SPACE) {
      if (start < index) {
        sequences.push({ end: index, start });
      }
      start = index + 1;
    }
  }
  return sequences;
}

function activeRequirements(
  requirements: readonly Grade1Requirement[],
  sequence: SymbolsSequence,
): readonly Grade1Requirement[] {
  return requirements.filter((requirement) => {
    if (
      requirement.offset < sequence.start ||
      requirement.offset >= sequence.end
    ) {
      return false;
    }
    if (
      requirement.kind === "numeric-symbol" ||
      requirement.kind === "symbol"
    ) {
      return true;
    }
    return (
      requirement.offset === sequence.start && requirement.end === sequence.end
    );
  });
}

function applyInsertions(
  braille: string,
  insertions: readonly Grade1Insertion[],
): string {
  const descending = [...insertions].sort(
    (left, right) => right.offset - left.offset,
  );
  let result = braille;
  for (const insertion of descending) {
    result = `${result.slice(0, insertion.offset)}${insertion.indicator}${result.slice(insertion.offset)}`;
  }
  return result;
}

function applyPreferredGrade1(
  rendered: RenderSuccess,
): RenderSuccess {
  const { braille, requirements } = rendered;
  const insertions: Grade1Insertion[] = [];
  let protectedSequenceCount = 0;
  for (const sequence of symbolsSequences(braille)) {
    const active = activeRequirements(requirements, sequence);
    if (active.length === 0) {
      continue;
    }
    const numeric = active.filter(
      (requirement) => requirement.kind === "numeric-symbol",
    );
    const counted = active.filter(
      (requirement) => requirement.kind !== "numeric-symbol",
    );
    if (counted.length === 0) {
      insertions.push(
        ...numeric.map((requirement): Grade1Insertion => ({
          indicator: GRADE1_SYMBOL_INDICATOR,
          offset: requirement.offset,
        })),
      );
      continue;
    }
    protectedSequenceCount += 1;
    const wordRequired =
      counted.some((requirement) => requirement.kind === "standing-word") ||
      counted.length > 1;
    if (wordRequired) {
      insertions.push({
        indicator: GRADE1_WORD_INDICATOR,
        offset: sequence.start,
      });
      continue;
    }
    insertions.push(
      ...numeric.map((requirement): Grade1Insertion => ({
        indicator: GRADE1_SYMBOL_INDICATOR,
        offset: requirement.offset,
      })),
    );
    for (const requirement of counted) {
      insertions.push({
        indicator: GRADE1_SYMBOL_INDICATOR,
        offset: requirement.offset,
      });
      break;
    }
  }
  if (protectedSequenceCount >= 3) {
    return renderSuccess(
      `${GRADE1_PASSAGE_INDICATOR}${braille}${GRADE1_TERMINATOR}`,
    );
  }
  return renderSuccess(applyInsertions(braille, insertions));
}

function renderBlock(
  block: TechnicalBlock,
  profile: TechnicalProfile,
): RenderResult {
  switch (block.kind) {
    case "computer":
      return renderComputer(block);
    case "expression": {
      const rendered = renderExpression(block.expression, profile);
      if (!rendered.ok) {
        return rendered;
      }
      if (profile.grade1 === "preferred") {
        return applyPreferredGrade1(rendered);
      }
      return renderSuccess(
        `${GRADE1_PASSAGE_INDICATOR}${rendered.braille}${GRADE1_TERMINATOR}`,
      );
    }
    case "matrix":
      return renderMatrix(block, profile);
  }
}

export function translateTechnicalText(input: string): TechnicalTextResult {
  const translated = translateGrade1(input);
  if (!translated.ok) {
    return { ...translated, mode: "technical-text" };
  }
  return { braille: translated.braille, mode: "technical-text", ok: true };
}

export function translateTechnical(document: TechnicalDocument): TechnicalResult {
  const rendered = document.blocks.map((block) =>
    renderBlock(block, document.profile),
  );
  const joined = joinRendered(
    rendered.map((result, index) => {
      if (!result.ok || index === rendered.length - 1) {
        return result;
      }
      return renderSuccess(`${result.braille}\n`);
    }),
  );
  if (!joined.ok) {
    return joined;
  }
  return { braille: joined.braille, mode: "technical", ok: true };
}

/** Translate exactly one explicit raw-text or structured technical input. */
export function translateTechnicalInput(
  input: TechnicalInput,
): TechnicalResult | TechnicalTextResult {
  switch (input.kind) {
    case "technical-document":
      return translateTechnical(input);
    case "technical-text":
      return translateTechnicalText(input.text);
  }
}
