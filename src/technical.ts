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
import {
  GRADE1_MODE_IDS,
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
} from "./generated/ueb-2024/grade1-program.js";
import { modeIndicator } from "./mode-engine.js";
import { loadSymbolProgram } from "./symbol-program.js";
import { TECHNICAL_SIGN_PROGRAM } from "./generated/ueb-2024/technical-program.js";
import type {
  TechnicalExpression, TechnicalGrade1Policy, TechnicalLayout, TechnicalLayoutCase,
  TechnicalLayoutChild, TechnicalProfile, TechnicalSignPath,
} from "./technical-program.js";
export type {
  BanaTechnicalProfile, InternationalTechnicalProfile, TechnicalGrade1Policy, TechnicalProfile,
  TechnicalComparison, TechnicalModifier, TechnicalOperation, TechnicalScriptPlacement,
  TechnicalShapeName, TechnicalEnclosure,
  SimpleArrowDirection, TechnicalIdentifier, TechnicalNumber, TechnicalSequence,
  TechnicalOperationExpression, TechnicalComparisonExpression, TechnicalNegation,
  TechnicalSimpleFraction, TechnicalGeneralFraction, TechnicalScript, TechnicalSquareRoot,
  TechnicalIndexedRoot, TechnicalRadical, TechnicalSimpleArrow, TechnicalChemicalElement,
  TechnicalGroup, TechnicalFunction, TechnicalModifiedItem, TechnicalShape, TechnicalExpression,
} from "./technical-program.js";

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

export interface TechnicalComputerUnsupportedCharacter
  extends TechnicalUnsupportedCharacter {
  readonly blockIndex: number;
  readonly lineIndex: number;
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
  | TechnicalComputerUnsupportedCharacter
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
type ComputerPrintResult = RenderSuccess | TechnicalUnsupportedCharacter;

function renderSuccess(
  braille: string,
  requirements: readonly Grade1Requirement[] = [],
): RenderSuccess {
  return { braille, ok: true, requirements };
}

const BRAILLE_SPACE = "⠀";
const GRADE1_SYMBOL_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.grade1, "symbol",
);
const GRADE1_WORD_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.grade1, "word",
);
const GRADE1_PASSAGE_INDICATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.grade1, "passage",
);
const GRADE1_TERMINATOR = modeIndicator(
  GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.grade1, "terminator",
);
const SYMBOL_RUNTIME = loadSymbolProgram({
  symbols: [...GRADE1_SYMBOL_PROGRAM.symbols, ...TECHNICAL_SIGN_PROGRAM.symbols],
});
const DELIMITERS = TECHNICAL_SIGN_PROGRAM.delimiters;
const ITEM_IDENTIFIER = new RegExp(TECHNICAL_SIGN_PROGRAM.itemPolicy.identifierPattern, "u");
const NUMERIC_CONTINUATION_IDENTIFIER = new RegExp(
  TECHNICAL_SIGN_PROGRAM.numericContinuation.identifierPattern, "u",
);
const STANDING_VALUES = TECHNICAL_SIGN_PROGRAM.grade1Protection.standingValues.map((rule) => ({
  kind: rule.kind,
  pattern: new RegExp(rule.pattern, rule.flags),
}));
const VALUE_PATTERNS = {
  "chemical-element": new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns["chemical-element"], "u"),
  "function-name": new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns["function-name"], "u"),
  identifier: new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns.identifier, "u"),
  number: new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns.number, "u"),
};
const COMPUTER_WHITESPACE = TECHNICAL_SIGN_PROGRAM.computerWhitespace;

const LAYOUTS = new Map<string, TechnicalLayout>(Object.entries(TECHNICAL_SIGN_PROGRAM.layouts));
const NUMERIC_INDICATOR = modeIndicator(GRADE1_MODE_PROGRAM, GRADE1_MODE_IDS.numeric, "symbol");

type ExpressionNode = Readonly<Record<string, unknown>>;

function nodeOf(value: unknown): ExpressionNode {
  /* v8 ignore next 3 -- typed API inputs are objects. */
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Technical expression must be an object.");
  }
  return Object.fromEntries(Object.entries(value));
}

function textOf(value: unknown): string {
  /* v8 ignore next 3 -- typed API inputs and validated layouts name strings. */
  if (typeof value !== "string") {
    throw new Error("Technical layout expected a string.");
  }
  return value;
}

/** Follow a layout path through the compiled program; `{ field }` steps read the expression. */
function signAt(path: TechnicalSignPath, expression: ExpressionNode): unknown {
  let value: unknown = TECHNICAL_SIGN_PROGRAM;
  for (const step of path) {
    value = nodeOf(value)[typeof step === "string" ? step : textOf(expression[step.field])];
  }
  return value;
}

function operationSpaced(profile: TechnicalProfile): boolean {
  const spacing = TECHNICAL_SIGN_PROGRAM.operationSpacing;
  return profile.jurisdiction === "international"
    ? spacing.international[profile.operationSpacing]
    : spacing["bana-2026"][profile.production];
}

function symbolCell(print: string): string {
  const braille = SYMBOL_RUNTIME.symbols.get(print)?.braille;
  /* v8 ignore next -- semantic maps are closed over the generated inventory. */
  if (braille === undefined) {
    throw new Error(`Compiled symbol inventory lacks ${JSON.stringify(print)}.`);
  }
  return braille;
}

const UNPREFIXED_LATIN_LETTER_CELLS = new Set(
  TECHNICAL_SIGN_PROGRAM.functionSpacing.letterCells,
);
const FUNCTION_NAME_BOUNDARY = new RegExp(TECHNICAL_SIGN_PROGRAM.functionSpacing.namePattern, "u");

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

function renderStandingValue(
  value: string,
  kind: TechnicalInvalidValueKind,
  pattern: RegExp,
): RenderResult {
  const rendered = renderPrintValue(value, kind, pattern);
  if (!rendered.ok) return rendered;
  for (const rule of STANDING_VALUES) {
    if (rule.pattern.test(value)) {
      return renderSuccess(rendered.braille, [{
        end: rendered.braille.length,
        kind: rule.kind,
        offset: 0,
      }]);
    }
  }
  return rendered;
}

function renderScriptValue(
  value: unknown,
  profile: TechnicalProfile,
): RenderResult {
  const rendered = renderExpression(value, profile);
  if (!rendered.ok) {
    return rendered;
  }
  const expression = nodeOf(value);
  const kind = textOf(expression["kind"]);
  const singleItem = kind === "identifier"
    ? ITEM_IDENTIFIER.test(textOf(expression["value"]))
    : Object.entries(TECHNICAL_SIGN_PROGRAM.itemPolicy.kinds).some(([name, single]) => name === kind && single);
  if (singleItem) {
    return rendered;
  }
  return renderSuccess(
    `${DELIMITERS.groupOpen}${rendered.braille}${DELIMITERS.groupClose}`,
    shiftRequirements(rendered.requirements, DELIMITERS.groupOpen.length),
  );
}

function needsSpaceBeforeFunction(
  previous: RenderSuccess | undefined,
  expression: ExpressionNode,
): boolean {
  return previous !== undefined &&
    UNPREFIXED_LATIN_LETTER_CELLS.has(previous.braille.at(-1) ?? "") &&
    expression["kind"] === "function" &&
    FUNCTION_NAME_BOUNDARY.test(textOf(expression["name"]));
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

function renderChild(
  child: TechnicalLayoutChild,
  expression: ExpressionNode,
  profile: TechnicalProfile,
): RenderResult {
  const value = expression[child.field];
  switch (child.render) {
    case "expression":
      return renderExpression(value, profile);
    case "script":
      return renderScriptValue(value, profile);
    case "value":
      return (child.standing ? renderStandingValue : renderPrintValue)(
        textOf(value), child.invalid, VALUE_PATTERNS[child.pattern],
      );
  }
}

function layoutCase(layout: Exclude<TechnicalLayout, { readonly sequence: string }>, expression: ExpressionNode): TechnicalLayoutCase {
  if (!("select" in layout)) return layout;
  const key = "field" in layout.select
    ? textOf(expression[layout.select.field])
    : textOf(signAt(layout.select.sign, expression));
  const chosen = Object.entries(layout.cases).find(([name]) => name === key)?.[1];
  /* v8 ignore next 3 -- typed inputs select a declared case. */
  if (chosen === undefined) {
    throw new Error(`Technical layout has no case ${JSON.stringify(key)}.`);
  }
  return chosen;
}

/** Interpret one layout: render children in order, then join the parts. */
function renderLayout(
  layout: TechnicalLayoutCase,
  expression: ExpressionNode,
  profile: TechnicalProfile,
): RenderResult {
  const rendered = new Map<string, RenderSuccess>();
  for (const child of layout.children) {
    const result = renderChild(child, expression, profile);
    if (!result.ok) {
      return result;
    }
    rendered.set(child.name, result);
  }
  const renderedChild = (name: string): RenderSuccess => {
    const result = rendered.get(name);
    /* v8 ignore next 3 -- validated layouts name declared children. */
    if (result === undefined) {
      throw new Error(`Technical layout has no child ${name}.`);
    }
    return result;
  };
  let braille = "";
  const requirements: Grade1Requirement[] = [];
  const widened: number[] = [];
  for (const part of layout.parts) {
    if ("child" in part) {
      const child = renderedChild(part.child);
      const dropped = part.withoutNumericIndicator === true ? NUMERIC_INDICATOR.length : 0;
      for (const requirement of child.requirements) {
        if (part.widen?.some((kind) => kind === requirement.kind) === true &&
          requirement.offset === 0 && requirement.end === child.braille.length) {
          widened.push(requirements.length);
        }
        requirements.push(...shiftRequirements([requirement], braille.length - dropped));
      }
      braille += child.braille.slice(dropped);
    } else if ("space" in part) {
      const spaced = part.space === "always" ||
        (part.space === "operation" && operationSpaced(profile)) ||
        (part.space === "letter" &&
          UNPREFIXED_LATIN_LETTER_CELLS.has(renderedChild(part.before).braille.charAt(0)));
      braille += spaced ? BRAILLE_SPACE : "";
    } else {
      const cells = "sign" in part
        ? textOf(signAt(part.sign, expression))
        : symbolCell(textOf(signAt(part.symbol, expression)));
      if (part.require !== undefined) {
        requirements.push({
          end: braille.length + (part.requireCells ?? cells.length),
          kind: part.require,
          offset: braille.length,
        });
      }
      braille += cells;
    }
  }
  return renderSuccess(braille, requirements.map((requirement, index) =>
    widened.includes(index) ? { ...requirement, end: braille.length, offset: 0 } : requirement));
}

function renderSequence(items: unknown, profile: TechnicalProfile): RenderResult {
  let braille = "";
  const requirements: Grade1Requirement[] = [];
  let offset = 0;
  let previousKind: unknown;
  let previousRendered: RenderSuccess | undefined;
  /* v8 ignore next 3 -- typed sequences carry an item list. */
  if (!Array.isArray(items)) {
    throw new Error("Technical sequence items must be a list.");
  }
  for (const value of items) {
    const item = nodeOf(value);
    const itemRendered = renderExpression(item, profile);
    if (!itemRendered.ok) {
      return itemRendered;
    }
    if (needsSpaceBeforeFunction(previousRendered, item)) {
      braille += BRAILLE_SPACE;
      offset += BRAILLE_SPACE.length;
    }
    requirements.push(
      ...shiftRequirements(itemRendered.requirements, offset),
    );
    if (
      TECHNICAL_SIGN_PROGRAM.numericContinuation.precedingKinds.some((kind) => kind === previousKind) &&
      item["kind"] === "identifier" &&
      NUMERIC_CONTINUATION_IDENTIFIER.test(textOf(item["value"]))
    ) {
      requirements.push({
        end: offset + 1,
        kind: "numeric-mode",
        offset,
      });
    }
    braille += itemRendered.braille;
    offset += itemRendered.braille.length;
    previousKind = item["kind"];
    previousRendered = itemRendered;
  }
  return renderSuccess(braille, requirements);
}

/** Render one expression through its kind's cited layout (technical-layout-rules.json). */
function renderExpression(
  value: unknown,
  profile: TechnicalProfile,
): RenderResult {
  const expression = nodeOf(value);
  const kind = textOf(expression["kind"]);
  const layout = LAYOUTS.get(kind);
  /* v8 ignore next 3 -- typed inputs name a declared expression kind. */
  if (layout === undefined) {
    throw new Error(`Technical layout missing for ${kind}.`);
  }
  return "sequence" in layout
    ? renderSequence(expression[layout.sequence], profile)
    : renderLayout(layoutCase(layout, expression), expression, profile);
}

function translateComputerPrint(
  text: string,
  translator: (input: string) => Grade1TextResult | Grade2TextResult,
  codeUnitOffset: number,
  scalarOffset: number,
): ComputerPrintResult {
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
): ComputerPrintResult {
  let braille = "";
  let cursor = 0;
  while (cursor < line.length) {
    if (line.charAt(cursor) === " ") {
      let end = cursor + 1;
      while (line.charAt(end) === " ") {
        end += 1;
      }
      const count = end - cursor;
      if (count >= COMPUTER_WHITESPACE.minimumRunLength) {
        const edge = BRAILLE_SPACE.repeat(COMPUTER_WHITESPACE.ordinaryEdgeLength);
        braille += edge + COMPUTER_WHITESPACE.visibleSpace.repeat(
          count - 2 * COMPUTER_WHITESPACE.ordinaryEdgeLength,
        ) + edge;
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

function renderComputer(
  block: TechnicalComputerBlock,
  blockIndex: number,
): RenderSuccess | TechnicalComputerUnsupportedCharacter {
  const translator =
    block.grade === "grade1" ? translateGrade1 : block.translator;
  const translatedLines: string[] = [];
  for (const [lineIndex, line] of block.lines.entries()) {
    const translated =
      block.spacing === "significant"
        ? renderSignificantComputerLine(line, translator)
        : translateComputerPrint(line, translator, 0, 0);
    if (!translated.ok) {
      return { ...translated, blockIndex, lineIndex };
    }
    translatedLines.push(translated.braille);
  }
  return renderSuccess(translatedLines.join("\n"));
}

function renderMatrix(
  block: TechnicalMatrixBlock,
  profile: TechnicalProfile,
): RenderResult {
  const expectedColumns = block.rows[0].length;
  const enclosure = DELIMITERS.matrixEnclosures[block.enclosure];
  const gap = BRAILLE_SPACE.repeat(block.columnGap);
  let braille = "";
  const requirements: Grade1Requirement[] = [];
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
    if (rowIndex > 0) {
      braille += "\n";
    }
    braille += enclosure.open;
    for (const [columnIndex, expression] of row.entries()) {
      if (columnIndex > 0) {
        braille += gap;
      }
      const rendered = renderExpression(expression, profile);
      if (!rendered.ok) {
        return rendered;
      }
      requirements.push(
        ...shiftRequirements(rendered.requirements, braille.length),
      );
      braille += rendered.braille;
    }
    braille += enclosure.close;
  }
  return renderSuccess(braille, requirements);
}

type Grade1RequirementKind =
  | "numeric-mode"
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
  readonly indicator: string;
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
      requirement.kind === "numeric-mode" ||
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

function numericModeInsertions(
  requirements: readonly Grade1Requirement[],
): readonly Grade1Insertion[] {
  return requirements
    .filter((requirement) => requirement.kind === "numeric-mode")
    .map((requirement) => ({
      indicator: GRADE1_SYMBOL_INDICATOR,
      offset: requirement.offset,
    }));
}

function applyGrade1Protection(
  rendered: RenderSuccess,
  policy: TechnicalGrade1Policy,
): RenderSuccess {
  const { braille, requirements } = rendered;
  const requiredNumericMode = numericModeInsertions(requirements);
  if (policy === "all-technical") {
    return renderSuccess(
      `${GRADE1_PASSAGE_INDICATOR}${applyInsertions(braille, requiredNumericMode)}${GRADE1_TERMINATOR}`,
    );
  }

  const insertions: Grade1Insertion[] = [...requiredNumericMode];
  let protectedSequenceCount = 0;
  for (const sequence of symbolsSequences(braille)) {
    const active = activeRequirements(requirements, sequence);
    if (active.length === 0) {
      continue;
    }
    const counted = active.filter(
      (requirement) => requirement.kind !== "numeric-mode",
    );
    if (counted.length === 0) {
      continue;
    }
    protectedSequenceCount += 1;
    const wordRequired =
      counted.some((requirement) => requirement.kind === "standing-word") ||
      counted.length > TECHNICAL_SIGN_PROGRAM.grade1Protection.maxSymbolsPerSequence;
    if (wordRequired) {
      insertions.push({
        indicator: GRADE1_WORD_INDICATOR,
        offset: sequence.start,
      });
      continue;
    }
    for (const requirement of counted) {
      insertions.push({
        indicator: GRADE1_SYMBOL_INDICATOR,
        offset: requirement.offset,
      });
      break;
    }
  }
  if (protectedSequenceCount >= TECHNICAL_SIGN_PROGRAM.grade1Protection.passageSequenceThreshold) {
    return renderSuccess(
      `${GRADE1_PASSAGE_INDICATOR}${applyInsertions(braille, requiredNumericMode)}${GRADE1_TERMINATOR}`,
    );
  }
  return renderSuccess(applyInsertions(braille, insertions));
}

function renderBlock(
  block: TechnicalBlock,
  profile: TechnicalProfile,
  blockIndex: number,
): RenderResult {
  switch (block.kind) {
    case "computer":
      return renderComputer(block, blockIndex);
    case "expression": {
      const rendered = renderExpression(block.expression, profile);
      if (!rendered.ok) {
        return rendered;
      }
      return applyGrade1Protection(rendered, profile.grade1);
    }
    case "matrix": {
      const rendered = renderMatrix(block, profile);
      return rendered.ok
        ? applyGrade1Protection(rendered, "all-technical")
        : rendered;
    }
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
  const rendered = document.blocks.map((block, blockIndex) =>
    renderBlock(block, document.profile, blockIndex),
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
