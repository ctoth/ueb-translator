import {
  runContextualTransducer,
  type ContextualAppliedRule,
  type ContextualBoundary,
  type ContextualBoundaryKind,
  type ContextualTransduction,
} from "./contextual-transducer.js";
import { GRADE2_PROGRAM } from "./generated/grade2-program.js";
import { translateGrade1 } from "./grade1.js";

export type Grade2BoundaryKind = ContextualBoundaryKind;
export type Grade2Boundary = ContextualBoundary;

export interface Grade2TextRun {
  readonly kind: "text";
  readonly text: string;
}

export interface Grade2WordRun {
  readonly boundaries?: readonly Grade2Boundary[];
  readonly kind: "word";
  readonly standing: "alone" | "joined";
  readonly text: string;
}

export type Grade2Run = Grade2TextRun | Grade2WordRun;

export interface Grade2Document {
  readonly kind: "grade2-document";
  readonly runs: readonly Grade2Run[];
}

export interface Grade2Success {
  readonly braille: string;
  readonly mode: "grade2";
  readonly ok: true;
}

export interface Grade2UnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "grade2";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export interface Grade2InvalidBoundary {
  readonly at: number;
  readonly mode: "grade2";
  readonly ok: false;
  readonly reason: "invalid-boundary";
  readonly runIndex: number;
}

export type Grade2Result =
  | Grade2InvalidBoundary
  | Grade2Success
  | Grade2UnsupportedCharacter;

export type Grade2TextResult = Grade2Success | Grade2UnsupportedCharacter;

export type Grade2AppliedRule = ContextualAppliedRule;

export interface Grade2InternalSuccess extends Grade2Success {
  readonly rules: readonly Grade2AppliedRule[];
}

export type Grade2InternalResult =
  | Grade2InternalSuccess
  | Grade2InvalidBoundary
  | Grade2UnsupportedCharacter;

interface LowerSignContext {
  readonly hasLowerPunctuation: boolean;
  readonly hasUpperPunctuation: boolean;
}

const CAPITAL_INDICATOR = "⠠";
const CAPITALS_WORD_INDICATOR = "⠠⠠";
const LETTER_CELLS = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
const NO_PUNCTUATION_CONTACT: LowerSignContext = {
  hasLowerPunctuation: false,
  hasUpperPunctuation: false,
};

function letterCell(letter: string): string {
  const index = letter.charCodeAt(0) - 97;
  return LETTER_CELLS.charAt(index);
}

function contractLexicalWord(
  word: string,
  boundaries: readonly Grade2Boundary[],
  standing: boolean,
  eligibilityWord: string,
  eligibilityOffset: number,
  lowerSign: LowerSignContext,
): ContextualTransduction {
  let braille = "";
  const rules: Grade2AppliedRule[] = [];
  let cursor = 0;

  for (const match of word.matchAll(/[a-z]+/gu)) {
    const start = match.index;
    if (start > cursor) {
      const punctuation = word.slice(cursor, start);
      braille += "⠄".repeat(Array.from(punctuation).length);
    }
    const segment = match[0];
    const segmentBoundaries = boundaries
      .filter((boundary) => boundary.at > start && boundary.at < start + segment.length)
      .map((boundary) => ({
        at: boundary.at - start,
        kind: boundary.kind,
      }));
    const contracted = runContextualTransducer(
      GRADE2_PROGRAM,
      {
        boundaries: segmentBoundaries,
        eligibilityOffset: eligibilityOffset + start,
        eligibilityWord,
        hasLowerPunctuation: lowerSign.hasLowerPunctuation,
        hasUpperPunctuation: lowerSign.hasUpperPunctuation,
        standing,
        word: segment,
      },
      letterCell,
    );
    braille += contracted.braille;
    rules.push(...contracted.rules.map((rule) => ({
      ...rule,
      end: start + rule.end,
      start: start + rule.start,
    })));
    cursor = start + segment.length;
  }
  return { braille, rules };
}

function capitalPrefix(text: string): string | undefined {
  if (text === text.toLowerCase()) {
    return "";
  }
  if (text.length >= 2 && text === text.toUpperCase()) {
    return CAPITALS_WORD_INDICATOR;
  }
  const first = text.charAt(0);
  const rest = text.slice(1);
  return first === first.toUpperCase() && rest === rest.toLowerCase()
    ? CAPITAL_INDICATOR
    : undefined;
}

function translateWord(
  run: Grade2WordRun,
  globalOffset: number,
  appendixEligibility: readonly [word: string, offset: number] = [
    run.text.toLowerCase(),
    0,
  ],
  lowerSignContext: LowerSignContext = NO_PUNCTUATION_CONTACT,
): Grade2InternalResult {
  const boundaries = run.boundaries ?? [];
  const lower = run.text.toLowerCase();
  const prefix = capitalPrefix(run.text);
  if (!/^['’]?[a-z]+(?:['’][a-z]+)*$/u.test(lower) || prefix === undefined) {
    const grade1 = translateGrade1(run.text);
    return grade1.ok
      ? { braille: grade1.braille, mode: "grade2", ok: true, rules: [] }
      : { ...grade1, mode: "grade2" };
  }

  const contracted = contractLexicalWord(
    lower,
    boundaries,
    run.standing === "alone",
    appendixEligibility[0],
    appendixEligibility[1],
    lowerSignContext,
  );
  return {
    braille: prefix + contracted.braille,
    mode: "grade2",
    ok: true,
    rules: contracted.rules.map((rule) => ({
      ...rule,
      end: globalOffset + rule.end,
      start: globalOffset + rule.start,
    })),
  };
}

function isStandingBoundary(character: string): boolean {
  return character === "" || character === " " || character === "\n" ||
    character === "\r" || character === "-" || character === "–" ||
    character === "—";
}

function isOpeningStandingPunctuation(character: string): boolean {
  return character === "(" || character === "[" || character === "{" ||
    character === "“" || character === "‘" || character === "\"" ||
    character === "'" || character === "«";
}

function isClosingStandingPunctuation(character: string): boolean {
  return character === "," || character === ";" || character === ":" ||
    character === "." || character === "…" || character === "!" ||
    character === "?" || character === ")" || character === "]" ||
    character === "}" || character === "”" || character === "’" ||
    character === "\"" || character === "'" || character === "»";
}

function isStandingAlone(
  text: string,
  start: number,
  end: number,
): boolean {
  let before = start - 1;
  while (before >= 0 && isOpeningStandingPunctuation(text.charAt(before))) {
    before -= 1;
  }
  if (!isStandingBoundary(text.charAt(before))) {
    return false;
  }

  let after = end;
  while (after < text.length && isClosingStandingPunctuation(text.charAt(after))) {
    after += 1;
  }
  return isStandingBoundary(text.charAt(after));
}

function adaptedGrade1(text: string, globalOffset: number): Grade2InternalResult {
  const translated = translateGrade1(text);
  if (translated.ok) {
    return { braille: translated.braille, mode: "grade2", ok: true, rules: [] };
  }
  return {
    ...translated,
    codeUnitIndex: globalOffset + translated.codeUnitIndex,
    mode: "grade2",
    scalarIndex: globalOffset + translated.scalarIndex,
  };
}

function isLowerOnlyPunctuation(character: string): boolean {
  switch (character) {
    case ",":
    case ";":
    case ":":
    case ".":
    case "…":
    case "?":
    case "\"":
    case "'":
    case "“":
    case "”":
    case "‘":
    case "’":
    case "-":
    case "–":
    case "—":
      return true;
    default:
      return false;
  }
}

function lowerSignContextAt(
  sourceText: string,
  start: number,
  end: number,
): LowerSignContext {
  let hasLowerPunctuation = false;
  let hasUpperPunctuation = false;
  const inspect = (initial: number, step: -1 | 1): void => {
    let index = initial;
    while (index >= 0 && index < sourceText.length) {
      const character = sourceText.charAt(index);
      if (/^[\p{L}\p{M}\p{N}\s]$/u.test(character)) {
        break;
      }
      if (isLowerOnlyPunctuation(character)) {
        hasLowerPunctuation = true;
      } else {
        hasUpperPunctuation = true;
      }
      if (character === "-" || character === "–" || character === "—") {
        break;
      }
      index += step;
    }
  };
  inspect(start - 1, -1);
  inspect(end, 1);
  return { hasLowerPunctuation, hasUpperPunctuation };
}

function translateLexicalSequence(
  sequence: string,
  globalOffset: number,
  sourceText: string,
): Grade2InternalResult {
  const eligibilityWord = sequence.toLowerCase();
  let braille = "";
  let cursor = 0;
  const rules: Grade2AppliedRule[] = [];

  for (const match of sequence.matchAll(/[^-–—]+/gu)) {
    const start = match.index;
    if (start > cursor) {
      const separator = adaptedGrade1(
        sequence.slice(cursor, start),
        globalOffset + cursor,
      );
      /* v8 ignore next -- lexical sequence separators are validated dash scalars. */
      if (!separator.ok) {
        return separator;
      }
      braille += separator.braille;
    }
    const text = match[0];
    const translated = translateWord(
      {
        kind: "word",
        standing: isStandingAlone(
          sourceText,
          globalOffset + start,
          globalOffset + start + text.length,
        )
          ? "alone"
          : "joined",
        text,
      },
      globalOffset + start,
      [eligibilityWord, start],
      lowerSignContextAt(
        sourceText,
        globalOffset + start,
        globalOffset + start + text.length,
      ),
    );
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules);
    cursor = start + text.length;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

function translatePlainText(text: string): Grade2InternalResult {
  let braille = "";
  let cursor = 0;
  const rules: Grade2AppliedRule[] = [];
  for (
    const match of text.matchAll(
      /['’]twould[\p{L}\p{M}]*(?:['’][\p{L}\p{M}]+)*|[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:[-–—][\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*/giu,
    )
  ) {
    const start = match.index;
    const word = match[0];
    if (start > cursor) {
      const separator = adaptedGrade1(text.slice(cursor, start), cursor);
      if (!separator.ok) {
        return separator;
      }
      braille += separator.braille;
    }
    const translated = translateLexicalSequence(word, start, text);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules);
    cursor = start + word.length;
  }
  if (cursor < text.length) {
    const separator = adaptedGrade1(text.slice(cursor), cursor);
    if (!separator.ok) {
      return separator;
    }
    braille += separator.braille;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

function translateDocument(document: Grade2Document): Grade2InternalResult {
  let braille = "";
  let globalOffset = 0;
  const rules: Grade2AppliedRule[] = [];
  for (const [runIndex, run] of document.runs.entries()) {
    if (run.kind === "word") {
      for (const boundary of run.boundaries ?? []) {
        if (boundary.at <= 0 || boundary.at >= run.text.length) {
          return {
            at: boundary.at,
            mode: "grade2",
            ok: false,
            reason: "invalid-boundary",
            runIndex,
          };
        }
      }
    }
    const translated = run.kind === "word"
      ? translateWord(run, globalOffset)
      : translatePlainText(run.text);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
    rules.push(...translated.rules.map((rule) => ({
      ...rule,
      end: run.kind === "word" ? rule.end : globalOffset + rule.end,
      start: run.kind === "word" ? rule.start : globalOffset + rule.start,
    })));
    globalOffset += run.text.length;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

export function translateGrade2Internal(
  input: string | Grade2Document,
): Grade2InternalResult {
  return typeof input === "string" ? translatePlainText(input) : translateDocument(input);
}

/** Translate print to deterministic contracted UEB. */
export function translateGrade2(input: string): Grade2TextResult;
export function translateGrade2(input: Grade2Document): Grade2Result;
export function translateGrade2(input: string | Grade2Document): Grade2Result {
  const result = translateGrade2Internal(input);
  if (!result.ok) {
    return result;
  }
  return { braille: result.braille, mode: "grade2", ok: true };
}
