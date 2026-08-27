/**
 * Deterministic uncontracted Unified English Braille translation.
 *
 * Normative rules: ICEB, Rules of Unified English Braille, Third Edition
 * (2024), sections 3-9. https://iceb.org/publications/ueb/
 *
 * The plain-string API accepts only print characters whose UEB meaning is
 * determined by the character and its normative context. Semantic distinctions
 * such as typeform are represented explicitly by Grade1Document.
 */

import {
  GRADE1_MODE_CLASS_IDS,
  GRADE1_MODE_IDS,
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
} from "./generated/grade1-program.js";
import {
  activeModeBefore,
  indicatorKind,
  modeIndicator,
  resolveModes,
  type ModeUnit,
} from "./mode-engine.js";
import { loadSymbolProgram } from "./symbol-program.js";

export type Grade1Typeform =
  | "bold"
  | "italic"
  | "script"
  | "transcriber-defined"
  | "underline";

export interface Grade1TextRun {
  readonly text: string;
  readonly typeforms?: readonly Grade1Typeform[];
}

export interface Grade1BrailleGroup {
  readonly kind: "braille-group";
  readonly runs: readonly [Grade1Run, ...Grade1Run[]];
}

export interface Grade1Ligature {
  readonly kind: "ligature";
  readonly letters: readonly [string, string, ...string[]];
}

export type Grade1Run = Grade1BrailleGroup | Grade1Ligature | Grade1TextRun;

export interface Grade1Paragraph {
  readonly runs: readonly Grade1Run[];
}

export interface Grade1Document {
  readonly kind: "grade1-document";
  readonly paragraphs: readonly Grade1Paragraph[];
}

export interface Grade1Success {
  readonly braille: string;
  readonly mode: "grade1";
  readonly ok: true;
}

export interface Grade1UnsupportedCharacter {
  readonly character: string;
  readonly codeUnitIndex: number;
  readonly mode: "grade1";
  readonly ok: false;
  readonly reason: "unsupported-character";
  readonly scalarIndex: number;
}

export interface Grade1InvalidLigature {
  readonly letterIndex: number;
  readonly mode: "grade1";
  readonly ok: false;
  readonly reason: "invalid-ligature-letter";
  readonly value: string;
}

export type Grade1Result =
  | Grade1InvalidLigature
  | Grade1Success
  | Grade1UnsupportedCharacter;

export type Grade1TextResult = Grade1Success | Grade1UnsupportedCharacter;

interface ScalarToken {
  readonly codeUnitIndex: number;
  readonly scalarIndex: number;
  readonly value: string;
}

interface Letter {
  readonly cell: string;
  readonly modifiers: string;
  readonly numericAmbiguous: boolean;
  readonly uppercase: boolean;
}

interface LetterUnit extends Letter {
  readonly kind: "letter";
}

interface DigitUnit {
  readonly cell: string;
  readonly kind: "digit";
}

interface SpaceUnit {
  readonly kind: "space";
}

interface LineBoundaryUnit {
  readonly kind: "line-boundary";
  readonly value: "\n" | "\r" | "\r\n";
}

interface SymbolUnit {
  readonly braille: string;
  readonly kind: "symbol";
  readonly source: string;
}

type TranslatableUnit =
  | DigitUnit
  | LetterUnit
  | LineBoundaryUnit
  | SpaceUnit
  | SymbolUnit;

interface ParsedText {
  readonly ok: true;
  readonly units: readonly TranslatableUnit[];
}

type ParseResult = Grade1UnsupportedCharacter | ParsedText;

const BRAILLE_BLANK = "⠀";
const LIGATURE_INDICATOR = "⠘⠖";
const SYMBOL_RUNTIME = loadSymbolProgram(GRADE1_SYMBOL_PROGRAM);
const NUMERIC_LETTER_CELLS = new Set(
  [...SYMBOL_RUNTIME.digits.values()].map((entry) => entry.braille),
);
const CAPITALS_MODE = GRADE1_MODE_IDS.capitals;
const GRADE1_MODE = GRADE1_MODE_IDS.grade1;
const NUMERIC_MODE = GRADE1_MODE_IDS.numeric;
const SEQUENCE_BOUNDARY_CLASS = GRADE1_MODE_CLASS_IDS["sequence-boundary"];
const TYPEFORM_MODES = {
  bold: GRADE1_MODE_IDS["typeform-bold"],
  italic: GRADE1_MODE_IDS["typeform-italic"],
  script: GRADE1_MODE_IDS["typeform-script"],
  "transcriber-defined": GRADE1_MODE_IDS["typeform-transcriber-defined"],
  underline: GRADE1_MODE_IDS["typeform-underline"],
} satisfies Readonly<Record<Grade1Typeform, number>>;

function classMask(...classIds: readonly number[]): number {
  let mask = 0;
  for (const classId of classIds) mask |= 2 ** classId;
  return mask;
}

function tokenize(text: string): readonly ScalarToken[] {
  const tokens: ScalarToken[] = [];
  let codeUnitIndex = 0;
  let scalarIndex = 0;

  for (const value of text) {
    const previous = tokens[tokens.length - 1];
    const codePoint = value.charCodeAt(0);
    if (
      codePoint >= 0x300 &&
      /^\p{M}$/u.test(value) &&
      previous !== undefined
    ) {
      tokens[tokens.length - 1] = {
        ...previous,
        value: previous.value + value,
      };
    } else {
      tokens.push({ codeUnitIndex, scalarIndex, value });
    }
    codeUnitIndex += value.length;
    scalarIndex += 1;
  }

  return tokens;
}

function analyseLetter(value: string): Letter | undefined {
  const lowercase = value.toLowerCase();
  const direct = SYMBOL_RUNTIME.letters.get(lowercase);
  if (direct !== undefined) {
    return {
      cell: direct.braille,
      modifiers: "",
      numericAmbiguous: NUMERIC_LETTER_CELLS.has(direct.braille),
      uppercase: value !== lowercase,
    };
  }

  const decomposition = value.normalize("NFD");
  const first = decomposition.charAt(0);
  const base = first.toLowerCase();
  const entry = SYMBOL_RUNTIME.letters.get(base);
  if (
    entry === undefined ||
    first.toUpperCase() === first.toLowerCase()
  ) {
    return undefined;
  }
  let modifiers = "";

  for (const component of decomposition.slice(first.length)) {
    const modifier = SYMBOL_RUNTIME.modifiers.get(component);
    if (modifier === undefined) {
      return undefined;
    }
    modifiers += modifier.braille;
  }

  return {
    cell: entry.braille,
    modifiers,
    numericAmbiguous: NUMERIC_LETTER_CELLS.has(entry.braille),
    uppercase: first === first.toUpperCase(),
  };
}

function digitCell(value: string): string | undefined {
  return SYMBOL_RUNTIME.digits.get(value)?.braille;
}

function isAsciiLineBoundary(value: string): value is "\n" | "\r" {
  return value === "\n" || value === "\r";
}

function unitModeClasses(unit: TranslatableUnit): ModeUnit {
  switch (unit.kind) {
    case "letter":
      return unit.uppercase
          ? classMask(GRADE1_MODE_CLASS_IDS["uppercase-letter"])
          : classMask(
              GRADE1_MODE_CLASS_IDS["lowercase-letter"],
              ...(unit.numericAmbiguous
                ? [GRADE1_MODE_CLASS_IDS["numeric-ambiguous-letter"]]
                : []),
            );
    case "digit":
      return classMask(GRADE1_MODE_CLASS_IDS.digit);
    case "line-boundary":
    case "space":
      return classMask(SEQUENCE_BOUNDARY_CLASS);
    case "symbol":
      return unit.source === "," || unit.source === "."
          ? classMask(GRADE1_MODE_CLASS_IDS["numeric-punctuation"])
          : 0;
  }
}

function unsupported(token: ScalarToken): Grade1UnsupportedCharacter {
  return {
    character: token.value,
    codeUnitIndex: token.codeUnitIndex,
    mode: "grade1",
    ok: false,
    reason: "unsupported-character",
    scalarIndex: token.scalarIndex,
  };
}

function parseAsciiText(text: string): ParseResult {
  const units: TranslatableUnit[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    const value = text.charAt(index);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      const lowercase = code <= 90 ? String.fromCharCode(code + 32) : value;
      const entry = SYMBOL_RUNTIME.letters.get(lowercase);
      /* v8 ignore next -- generated inventory contains all ASCII letters. */
      if (entry !== undefined) {
        units.push({
          cell: entry.braille,
          kind: "letter",
          modifiers: "",
          numericAmbiguous: NUMERIC_LETTER_CELLS.has(entry.braille),
          uppercase: code <= 90,
        });
        continue;
      }
    }
    const digit = SYMBOL_RUNTIME.digits.get(value);
    if (digit !== undefined) {
      units.push({ cell: digit.braille, kind: "digit" });
      continue;
    }
    if (value === " ") {
      units.push({ kind: "space" });
      continue;
    }
    if (value === "\r" || value === "\n") {
      if (value === "\r" && text.charAt(index + 1) === "\n") {
        units.push({ kind: "line-boundary", value: "\r\n" });
        index += 1;
      } else {
        units.push({ kind: "line-boundary", value });
      }
      continue;
    }
    const symbol = SYMBOL_RUNTIME.symbols.get(value)?.braille;
    if (symbol === undefined) {
      return unsupported({ codeUnitIndex: index, scalarIndex: index, value });
    }
    units.push({ braille: symbol, kind: "symbol", source: value });
  }
  return { ok: true, units };
}

function isAsciiText(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) > 0x7f) return false;
  }
  return true;
}

function parseText(text: string): ParseResult {
  if (isAsciiText(text)) {
    return parseAsciiText(text);
  }
  const tokens = tokenize(text);
  const units: TranslatableUnit[] = [];
  let skipUntil = 0;

  for (const [index, token] of tokens.entries()) {
    if (index < skipUntil) {
      continue;
    }
    const letter = analyseLetter(token.value);
    if (letter !== undefined) {
      units.push({ ...letter, kind: "letter" });
      continue;
    }
    const digit = digitCell(token.value);
    if (digit !== undefined) {
      units.push({ cell: digit, kind: "digit" });
      continue;
    }
    if (token.value === " ") {
      units.push({ kind: "space" });
      continue;
    }
    if (isAsciiLineBoundary(token.value)) {
      const next = tokens.at(index + 1);
      if (token.value === "\r" && next?.value === "\n") {
        units.push({ kind: "line-boundary", value: "\r\n" });
        skipUntil = index + 2;
      } else {
        units.push({ kind: "line-boundary", value: token.value });
      }
      continue;
    }
    const symbol = SYMBOL_RUNTIME.symbols.get(token.value)?.braille;
    if (symbol === undefined) {
      return unsupported(token);
    }
    units.push({ braille: symbol, kind: "symbol", source: token.value });
  }

  return { ok: true, units };
}

function questionMarkNeedsGrade1(
  previous: TranslatableUnit | undefined,
): boolean {
  return (
    previous === undefined ||
    previous.kind === "space" ||
    previous.kind === "line-boundary" ||
    (previous.kind === "symbol" &&
      (previous.source === "-" ||
        previous.source === "–" ||
        previous.source === "—"))
  );
}

function emittedUnit(unit: TranslatableUnit): string {
  switch (unit.kind) {
    case "letter": return unit.modifiers + unit.cell;
    case "digit": return unit.cell;
    case "space": return BRAILLE_BLANK;
    case "line-boundary": return unit.value;
    case "symbol": return unit.braille;
  }
}

function addContextClasses(
  units: readonly TranslatableUnit[],
  baseModeUnits: readonly ModeUnit[],
): readonly ModeUnit[] {
  const numericBefore = activeModeBefore(
    GRADE1_MODE_PROGRAM,
    NUMERIC_MODE,
    baseModeUnits,
  );
  return baseModeUnits.map((modeUnit, index) => {
    const unit = units[index];
    /* v8 ignore next -- map preserves the units array length. */
    if (unit === undefined) return modeUnit;
    const previous = index === 0 ? undefined : units[index - 1];
    const grade1Required =
      (unit.kind === "letter" &&
        unit.numericAmbiguous &&
        !unit.uppercase &&
        numericBefore[index] === true) ||
      (unit.kind === "symbol" &&
        unit.source === "?" &&
        questionMarkNeedsGrade1(previous));
    return grade1Required
      ? modeUnit | classMask(GRADE1_MODE_CLASS_IDS["grade1-required"])
      : modeUnit;
  });
}

function translateUnits(units: readonly TranslatableUnit[]): string {
  let braille = "";
  const baseModeUnits = units.map(unitModeClasses);
  const modeUnits = addContextClasses(units, baseModeUnits);
  const resolution = resolveModes(
    GRADE1_MODE_PROGRAM,
    [CAPITALS_MODE, NUMERIC_MODE, GRADE1_MODE],
    modeUnits,
    SEQUENCE_BOUNDARY_CLASS,
  );
  for (const [index, unit] of units.entries()) {
    braille +=
      (resolution.prefixes.get(index) ?? "") +
      emittedUnit(unit) +
      (resolution.suffixes.get(index) ?? "");
  }
  return braille;
}

function translateText(text: string): Grade1Result {
  const parsed = parseText(text);
  return parsed.ok
    ? { braille: translateUnits(parsed.units), mode: "grade1", ok: true }
    : parsed;
}

function countSequences(text: string): number {
  let count = 0;
  let insideSequence = false;
  for (const value of text) {
    const whitespace = value === " " || isAsciiLineBoundary(value);
    if (whitespace) {
      insideSequence = false;
    } else if (!insideSequence) {
      count += 1;
      insideSequence = true;
    }
  }
  return count;
}

function countNonWhitespaceScalars(text: string): number {
  let count = 0;
  for (const value of text) {
    if (value !== " " && !isAsciiLineBoundary(value)) {
      count += 1;
    }
  }
  return count;
}

function indicatorsFor(
  typeforms: readonly Grade1Typeform[],
  kind: "passage" | "symbol" | "terminator" | "word",
  reverse: boolean,
): string {
  const ordered = reverse ? [...typeforms].reverse() : typeforms;
  let result = "";
  for (const typeform of ordered) {
    result += modeIndicator(GRADE1_MODE_PROGRAM, TYPEFORM_MODES[typeform], kind);
  }
  return result;
}

function translateTypeformedRun(run: Grade1TextRun): Grade1Result {
  const typeforms = run.typeforms ?? [];
  if (typeforms.length === 0 || run.text.length === 0) {
    return translateText(run.text);
  }

  const sequenceCount = countSequences(run.text);
  const firstTypeform = typeforms[0];
  /* v8 ignore next -- the empty array returned above. */
  if (firstTypeform === undefined) {
    return translateText(run.text);
  }
  const selection = indicatorKind(
    GRADE1_MODE_PROGRAM,
    TYPEFORM_MODES[firstTypeform],
    countNonWhitespaceScalars(run.text),
    sequenceCount,
  );
  if (selection === "passage") {
    const translated = translateText(run.text);
    return translated.ok
      ? {
          braille:
            indicatorsFor(typeforms, "passage", false) +
            translated.braille +
            indicatorsFor(typeforms, "terminator", true),
          mode: "grade1",
          ok: true,
        }
      : translated;
  }

  if (sequenceCount === 1) {
    const translated = translateText(run.text);
    if (!translated.ok) {
      return translated;
    }
    return {
      braille: indicatorsFor(typeforms, selection, false) + translated.braille,
      mode: "grade1",
      ok: true,
    };
  }

  let braille = "";
  let sequence = "";
  for (const value of run.text) {
    if (value === " " || isAsciiLineBoundary(value)) {
      if (sequence.length > 0) {
        const translated = translateText(sequence);
        if (!translated.ok) {
          return translated;
        }
        const kind = indicatorKind(
          GRADE1_MODE_PROGRAM,
          TYPEFORM_MODES[firstTypeform],
          countNonWhitespaceScalars(sequence),
          1,
        );
        braille += indicatorsFor(typeforms, kind, false) + translated.braille;
        sequence = "";
      }
      braille += value === " " ? BRAILLE_BLANK : value;
    } else {
      sequence += value;
    }
  }
  if (sequence.length > 0) {
    const translated = translateText(sequence);
    if (!translated.ok) {
      return translated;
    }
    const kind = indicatorKind(
      GRADE1_MODE_PROGRAM,
      TYPEFORM_MODES[firstTypeform],
      countNonWhitespaceScalars(sequence),
      1,
    );
    braille += indicatorsFor(typeforms, kind, false) + translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateLigature(run: Grade1Ligature): Grade1Result {
  const letters: LetterUnit[] = [];
  for (const [letterIndex, value] of run.letters.entries()) {
    const parsed = parseText(value);
    const unit = parsed.ok ? parsed.units.at(0) : undefined;
    if (
      !parsed.ok ||
      parsed.units.length !== 1 ||
      unit?.kind !== "letter"
    ) {
      return {
        letterIndex,
        mode: "grade1",
        ok: false,
        reason: "invalid-ligature-letter",
        value,
      };
    }
    letters.push(unit);
  }

  const capitalsWord = letters.every((letter) => letter.uppercase);
  let braille = capitalsWord
    ? modeIndicator(GRADE1_MODE_PROGRAM, CAPITALS_MODE, "word")
    : "";
  for (const [index, letter] of letters.entries()) {
    if (index > 0) {
      if (!capitalsWord && letter.uppercase) {
        braille += modeIndicator(GRADE1_MODE_PROGRAM, CAPITALS_MODE, "symbol");
      }
      braille += LIGATURE_INDICATOR;
    } else if (!capitalsWord && letter.uppercase) {
      braille += modeIndicator(GRADE1_MODE_PROGRAM, CAPITALS_MODE, "symbol");
    }
    braille += letter.modifiers + letter.cell;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateRuns(runs: readonly Grade1Run[]): Grade1Result {
  let braille = "";
  for (const run of runs) {
    const translated =
      !("kind" in run)
        ? translateTypeformedRun(run)
        : run.kind === "braille-group"
          ? translateRuns(run.runs)
          : translateLigature(run);
    if (!translated.ok) {
      return translated;
    }
    braille +=
      "kind" in run && run.kind === "braille-group"
        ? `⠣${translated.braille}⠜`
        : translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

function translateDocument(document: Grade1Document): Grade1Result {
  let braille = "";
  let firstParagraph = true;
  for (const paragraph of document.paragraphs) {
    if (firstParagraph) {
      firstParagraph = false;
    } else {
      braille += "\n\n";
    }
    const translated = translateRuns(paragraph.runs);
    if (!translated.ok) {
      return translated;
    }
    braille += translated.braille;
  }
  return { braille, mode: "grade1", ok: true };
}

/** Runtime composition used by the thin public Grade 1 orchestrator. */
export function translateGrade1Runtime(input: string): Grade1TextResult;
export function translateGrade1Runtime(input: Grade1Document): Grade1Result;
export function translateGrade1Runtime(input: string | Grade1Document): Grade1Result {
  return typeof input === "string" ? translateText(input) : translateDocument(input);
}
