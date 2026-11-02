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
  TechnicalComparison, TechnicalExpression, TechnicalGrade1Policy,
  TechnicalOperation, TechnicalProfile, TechnicalShape,
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
const VALUE_PATTERNS = {
  "chemical-element": new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns["chemical-element"], "u"),
  "function-name": new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns["function-name"], "u"),
  identifier: new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns.identifier, "u"),
  number: new RegExp(TECHNICAL_SIGN_PROGRAM.valuePatterns.number, "u"),
};
const VISIBLE_SPACE = "⠬";

function operationCell(operation: TechnicalOperation): string {
  return symbolCell(TECHNICAL_SIGN_PROGRAM.operations[operation]);
}

function comparisonCell(comparison: TechnicalComparison): string {
  return symbolCell(TECHNICAL_SIGN_PROGRAM.comparisons[comparison]);
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

function shapeCell(shape: TechnicalShape): string {
  const signs = TECHNICAL_SIGN_PROGRAM.shapes;
  const braille = `${signs.fills[shape.fill]}${signs.names[shape.shape]}`;
  return shape.terminator === "present"
    ? `${braille}${signs.terminator}`
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

function renderStandingValue(
  value: string,
  kind: "chemical-element" | "identifier",
  pattern: RegExp,
): RenderResult {
  const rendered = renderPrintValue(value, kind, pattern);
  if (!rendered.ok) return rendered;
  if (/^[b-hj-np-z]$/iu.test(value)) {
    return renderSuccess(rendered.braille, [{
      end: rendered.braille.length,
      kind: "standing-symbol",
      offset: 0,
    }]);
  }
  if (/^\p{L}[\p{L}\p{M}\d]+$/u.test(value)) {
    return renderSuccess(rendered.braille, [{
      end: rendered.braille.length,
      kind: "standing-word",
      offset: 0,
    }]);
  }
  return rendered;
}

function renderScriptValue(
  expression: TechnicalExpression,
  profile: TechnicalProfile,
): RenderResult {
  const rendered = renderExpression(expression, profile);
  if (!rendered.ok) {
    return rendered;
  }
  const singleItem = expression.kind === "identifier"
    ? ITEM_IDENTIFIER.test(expression.value)
    : TECHNICAL_SIGN_PROGRAM.itemPolicy.kinds[expression.kind];
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
  expression: TechnicalExpression,
): boolean {
  return previous !== undefined &&
    UNPREFIXED_LATIN_LETTER_CELLS.has(previous.braille.at(-1) ?? "") &&
    expression.kind === "function" &&
    FUNCTION_NAME_BOUNDARY.test(expression.name);
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
      return renderStandingValue(
        expression.symbol,
        "chemical-element",
        VALUE_PATTERNS["chemical-element"],
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
        DELIMITERS.fractionOpen.length +
        numerator.braille.length +
        DELIMITERS.fractionLine.length;
      return renderSuccess(
        `${DELIMITERS.fractionOpen}${numerator.braille}${DELIMITERS.fractionLine}${denominator.braille}${DELIMITERS.fractionClose}`,
        [
          { end: DELIMITERS.fractionOpen.length, kind: "symbol", offset: 0 },
          ...shiftRequirements(
            numerator.requirements,
            DELIMITERS.fractionOpen.length,
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
      const enclosure = DELIMITERS.enclosures[expression.enclosure];
      const openLength = enclosure.open.length;
      const totalLength = openLength + content.braille.length + enclosure.close.length;
      const requirements: Grade1Requirement[] = [];
      for (const requirement of content.requirements) {
        requirements.push(
          (requirement.kind === "standing-symbol" ||
              requirement.kind === "standing-word") &&
            requirement.offset === 0 && requirement.end === content.braille.length
            ? { ...requirement, end: totalLength, offset: 0 }
            : {
                ...requirement,
                end: requirement.end + openLength,
                offset: requirement.offset + openLength,
              },
        );
      }
      return renderSuccess(
        `${enclosure.open}${content.braille}${enclosure.close}`,
        requirements,
      );
    }
    case "identifier": {
      return renderStandingValue(
        expression.value,
        "identifier",
        VALUE_PATTERNS.identifier,
      );
    }
    case "function": {
      const name = renderPrintValue(
        expression.name,
        "function-name",
        VALUE_PATTERNS["function-name"],
      );
      const argument = renderExpression(expression.argument, profile);
      if (!name.ok) {
        return name;
      }
      if (!argument.ok) {
        return argument;
      }
      const space = UNPREFIXED_LATIN_LETTER_CELLS.has(
        argument.braille.charAt(0),
      )
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
      const modifier = TECHNICAL_SIGN_PROGRAM.modifiers[expression.modifier];
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
      const minus = operationCell("minus");
      return renderSuccess(
        `${minus}${operand.braille}`,
        shiftRequirements(operand.requirements, minus.length),
      );
    }
    case "number":
      return renderPrintValue(expression.value, "number", VALUE_PATTERNS.number);
    case "operation": {
      const left = renderExpression(expression.left, profile);
      const right = renderExpression(expression.right, profile);
      if (!left.ok) {
        return left;
      }
      if (!right.ok) {
        return right;
      }
      const spacing = TECHNICAL_SIGN_PROGRAM.operationSpacing;
      const spaced = profile.jurisdiction === "international"
        ? spacing.international[profile.operationSpacing]
        : spacing["bana-2026"][profile.production];
      const space = spaced ? BRAILLE_SPACE : "";
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
        const braille = `${DELIMITERS.radicalOpen}${radicand.braille}${DELIMITERS.radicalClose}`;
        return renderSuccess(braille, [
          { end: DELIMITERS.radicalOpen.length, kind: "symbol", offset: 0 },
          ...shiftRequirements(radicand.requirements, DELIMITERS.radicalOpen.length),
        ]);
      }
      const index = renderScriptValue(expression.index, profile);
      if (!index.ok) {
        return index;
      }
      const indicator = TECHNICAL_SIGN_PROGRAM.scripts["right-superscript"].indicator;
      const indexOffset = DELIMITERS.radicalOpen.length + indicator.length;
      const radicandOffset = indexOffset + index.braille.length;
      const braille = `${DELIMITERS.radicalOpen}${indicator}${index.braille}${radicand.braille}${DELIMITERS.radicalClose}`;
      return renderSuccess(braille, [
        { end: DELIMITERS.radicalOpen.length, kind: "symbol", offset: 0 },
        { end: indexOffset, kind: "symbol", offset: DELIMITERS.radicalOpen.length },
        ...shiftRequirements(index.requirements, indexOffset),
        ...shiftRequirements(radicand.requirements, radicandOffset),
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
      const { indicator, position } = TECHNICAL_SIGN_PROGRAM.scripts[expression.placement];
      const rendered = `${indicator}${script.braille}`;
      if (position === "before") {
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
      let previousRendered: RenderSuccess | undefined;
      for (const item of expression.items) {
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
          (previous?.kind === "number" ||
            previous?.kind === "simple-fraction") &&
          item.kind === "identifier" &&
          /^[a-j]/u.test(item.value)
        ) {
          requirements.push({
            end: offset + 1,
            kind: "numeric-mode",
            offset,
          });
        }
        braille += itemRendered.braille;
        offset += itemRendered.braille.length;
        previous = item;
        previousRendered = itemRendered;
      }
      return renderSuccess(braille, requirements);
    }
    case "shape":
      return renderSuccess(shapeCell(expression), [
        { end: 1, kind: "symbol", offset: 0 },
      ]);
    case "simple-arrow":
      return renderSuccess(symbolCell(TECHNICAL_SIGN_PROGRAM.arrows[expression.direction]), [
        { end: 1, kind: "symbol", offset: 0 },
      ]);
    case "simple-fraction": {
      const numerator = renderPrintValue(
        expression.numerator,
        "simple-fraction-numerator",
        VALUE_PATTERNS.number,
      );
      const denominator = renderPrintValue(
        expression.denominator,
        "simple-fraction-denominator",
        VALUE_PATTERNS.number,
      );
      if (!numerator.ok) {
        return numerator;
      }
      if (!denominator.ok) {
        return denominator;
      }
      return renderSuccess(
        `${numerator.braille}${DELIMITERS.simpleFractionLine}${denominator.braille.slice(1)}`,
      );
    }
  }
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
      counted.length > 1;
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
  if (protectedSequenceCount >= 3) {
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
