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
} from "./generated/ueb-2024/grade1-program.js";
import {
  activeModeBefore,
  indicatorKind,
  modeIndicator,
  resolveModes,
  type ModeUnit,
} from "./mode-engine.js";
import {
  loadSymbolProgram,
  type SymbolRuntime,
} from "./symbol-program.js";

export type Grade1Typeform =
  | "bold"
  | "italic"
  | "script"
  | "transcriber-defined"
  | "underline";

export interface Grade1TextRun {
  readonly kind?: "text";
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

export interface Grade1InvalidRun {
  readonly mode: "grade1";
  readonly ok: false;
  readonly reason: "invalid-run";
  readonly runIndex: number;
}

export type Grade1Result =
  | Grade1InvalidLigature
  | Grade1InvalidRun
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

export interface CompositionLetterUnit extends Letter {
  readonly kind: "letter";
  readonly source: string;
}

export interface CompositionDigitUnit {
  readonly cell: string;
  readonly kind: "digit";
  readonly source: string;
}

export interface CompositionSpaceUnit {
  readonly kind: "space";
  readonly source: " ";
}

export interface CompositionLineBoundaryUnit {
  readonly kind: "line-boundary";
  readonly source: "\n" | "\r" | "\r\n";
  readonly value: "\n" | "\r" | "\r\n";
}

export interface CompositionSymbolUnit {
  readonly braille: string;
  readonly kind: "symbol";
  readonly source: string;
}

export type CompositionUnit =
  | CompositionDigitUnit
  | CompositionLetterUnit
  | CompositionLineBoundaryUnit
  | CompositionSpaceUnit
  | CompositionSymbolUnit;

type TranslatableUnit = CompositionUnit;

export interface ParsedCompositionText {
  readonly ok: true;
  readonly units: readonly CompositionUnit[];
}

export type CompositionParseResult = Grade1UnsupportedCharacter | ParsedCompositionText;
type ParseResult = CompositionParseResult;

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

function analyseLetter(
  value: string,
  symbols: SymbolRuntime,
  numericLetterCells: ReadonlySet<string>,
): Letter | undefined {
  const lowercase = value.toLowerCase();
  const direct = symbols.letters.get(lowercase);
  if (direct !== undefined) {
    return {
      cell: direct.braille,
      modifiers: "",
      numericAmbiguous: numericLetterCells.has(direct.braille),
      uppercase: value !== lowercase,
    };
  }

  const decomposition = value.normalize("NFD");
  const first = decomposition.charAt(0);
  const base = first.toLowerCase();
  const entry = symbols.letters.get(base);
  if (
    entry === undefined ||
    first.toUpperCase() === first.toLowerCase()
  ) {
    return undefined;
  }
  let modifiers = "";

  for (const component of decomposition.slice(first.length)) {
    const modifier = symbols.modifiers.get(component);
    if (modifier === undefined) {
      return undefined;
    }
    modifiers += modifier.braille;
  }

  return {
    cell: entry.braille,
    modifiers,
    numericAmbiguous: numericLetterCells.has(entry.braille),
    uppercase: first === first.toUpperCase(),
  };
}

function digitCell(value: string, symbols: SymbolRuntime): string | undefined {
  return symbols.digits.get(value)?.braille;
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

function parseAsciiText(
  text: string,
  symbols: SymbolRuntime,
  numericLetterCells: ReadonlySet<string>,
): ParseResult {
  const units: TranslatableUnit[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    const value = text.charAt(index);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      const lowercase = code <= 90 ? String.fromCharCode(code + 32) : value;
      const entry = symbols.letters.get(lowercase);
      /* v8 ignore next -- generated inventory contains all ASCII letters. */
      if (entry !== undefined) {
        units.push({
          cell: entry.braille,
          kind: "letter",
          modifiers: "",
          numericAmbiguous: numericLetterCells.has(entry.braille),
          source: value,
          uppercase: code <= 90,
        });
        continue;
      }
    }
    const digit = symbols.digits.get(value);
    if (digit !== undefined) {
      units.push({ cell: digit.braille, kind: "digit", source: value });
      continue;
    }
    if (value === " ") {
      units.push({ kind: "space", source: " " });
      continue;
    }
    if (value === "\r" || value === "\n") {
      if (value === "\r" && text.charAt(index + 1) === "\n") {
        units.push({ kind: "line-boundary", source: "\r\n", value: "\r\n" });
        index += 1;
      } else {
        units.push({ kind: "line-boundary", source: value, value });
      }
      continue;
    }
    const symbol = symbols.symbols.get(value)?.braille;
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

function parseText(
  text: string,
  symbols: SymbolRuntime = SYMBOL_RUNTIME,
): ParseResult {
  const numericLetterCells = symbols === SYMBOL_RUNTIME
    ? NUMERIC_LETTER_CELLS
    : new Set([...symbols.digits.values()].map((entry) => entry.braille));
  if (isAsciiText(text)) {
    return parseAsciiText(text, symbols, numericLetterCells);
  }
  const tokens = tokenize(text);
  const units: TranslatableUnit[] = [];
  let skipUntil = 0;

  for (const [index, token] of tokens.entries()) {
    if (index < skipUntil) {
      continue;
    }
    const letter = analyseLetter(token.value, symbols, numericLetterCells);
    if (letter !== undefined) {
      units.push({ ...letter, kind: "letter", source: token.value });
      continue;
    }
    const digit = digitCell(token.value, symbols);
    if (digit !== undefined) {
      units.push({ cell: digit, kind: "digit", source: token.value });
      continue;
    }
    if (token.value === " ") {
      units.push({ kind: "space", source: " " });
      continue;
    }
    if (isAsciiLineBoundary(token.value)) {
      const next = tokens.at(index + 1);
      if (token.value === "\r" && next?.value === "\n") {
        units.push({ kind: "line-boundary", source: "\r\n", value: "\r\n" });
        skipUntil = index + 2;
      } else {
        units.push({ kind: "line-boundary", source: token.value, value: token.value });
      }
      continue;
    }
    const symbol = symbols.symbols.get(token.value)?.braille;
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
  additionalGrade1Required: ReadonlySet<number> = new Set(),
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
    const grade1Required = additionalGrade1Required.has(index) ||
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

export interface CompositionModePlan {
  readonly prefixes: ReadonlyMap<number, string>;
  readonly suffixes: ReadonlyMap<number, string>;
}

/** Parse once for either the uncontracted or contracted composition. */
export function parseCompositionText(text: string): CompositionParseResult {
  return parseText(text);
}

/** Parse with an explicitly composed symbol package. */
export function parseCompositionTextWithSymbols(
  text: string,
  symbols: SymbolRuntime,
): CompositionParseResult {
  return parseText(text, symbols);
}

/** Resolve shared capitals, numeric, and Grade 1 modes around an emission pass. */
export function resolveCompositionModes(
  units: readonly CompositionUnit[],
  additionalGrade1Required: ReadonlySet<number> = new Set(),
  contracted = false,
): CompositionModePlan {
  const baseModeUnits = units.map(unitModeClasses);
  return resolveModes(
    GRADE1_MODE_PROGRAM,
    contracted
      ? [GRADE1_MODE, CAPITALS_MODE, NUMERIC_MODE]
      : [CAPITALS_MODE, NUMERIC_MODE, GRADE1_MODE],
    addContextClasses(units, baseModeUnits, additionalGrade1Required),
    SEQUENCE_BOUNDARY_CLASS,
    contracted ? [CAPITALS_MODE] : [],
  );
}

export function emitCompositionUnit(unit: CompositionUnit): string {
  return emittedUnit(unit);
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

function translateText(text: string): Grade1TextResult {
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

export function translateTypeformedText(
  run: Grade1TextRun,
  translate: (text: string, codeUnitOffset: number) => Grade1TextResult,
): Grade1TextResult {
  const typeforms = run.typeforms ?? [];
  if (typeforms.length === 0 || run.text.length === 0) {
    return translate(run.text, 0);
  }

  const sequenceCount = countSequences(run.text);
  const firstTypeform = typeforms[0];
  /* v8 ignore next -- the empty array returned above. */
  if (firstTypeform === undefined) {
    return translate(run.text, 0);
  }
  const selection = indicatorKind(
    GRADE1_MODE_PROGRAM,
    TYPEFORM_MODES[firstTypeform],
    countNonWhitespaceScalars(run.text),
    sequenceCount,
  );
  if (selection === "passage") {
    const translated = translate(run.text, 0);
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
    const translated = translate(run.text, 0);
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
  let sequenceOffset = 0;
  let codeUnitOffset = 0;
  for (const value of run.text) {
    if (value === " " || isAsciiLineBoundary(value)) {
      if (sequence.length > 0) {
        const translated = translate(sequence, sequenceOffset);
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
      if (sequence.length === 0) sequenceOffset = codeUnitOffset;
      sequence += value;
    }
    codeUnitOffset += value.length;
  }
  if (sequence.length > 0) {
    const translated = translate(sequence, sequenceOffset);
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

function translateTypeformedRun(run: Grade1TextRun): Grade1Result {
  return translateTypeformedText(run, translateText);
}

function translateLigature(run: Grade1Ligature): Grade1Result {
  const letters: CompositionLetterUnit[] = [];
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

function isGrade1Typeform(value: unknown): value is Grade1Typeform {
  return value === "bold" ||
    value === "italic" ||
    value === "script" ||
    value === "transcriber-defined" ||
    value === "underline";
}

function isGrade1TextRun(run: object): run is Grade1TextRun {
  const kind = "kind" in run ? run.kind : undefined;
  const text = "text" in run ? run.text : undefined;
  const typeforms = "typeforms" in run ? run.typeforms : undefined;
  return (kind === undefined || kind === "text") &&
    typeof text === "string" &&
    (typeforms === undefined ||
      (Array.isArray(typeforms) && typeforms.every(isGrade1Typeform)));
}

function isGrade1Run(run: unknown): run is Grade1Run {
  if (typeof run !== "object" || run === null) return false;
  if (isGrade1TextRun(run)) return true;
  if (!("kind" in run)) return false;
  if (run.kind === "braille-group") {
    return "runs" in run && Array.isArray(run.runs) && run.runs.length > 0;
  }
  if (run.kind === "ligature") {
    return "letters" in run &&
      Array.isArray(run.letters) &&
      run.letters.length >= 2 &&
      run.letters.every((letter) => typeof letter === "string");
  }
  return false;
}

function translateRuns(runs: readonly Grade1Run[]): Grade1Result {
  let braille = "";
  for (const [runIndex, run] of runs.entries()) {
    if (!isGrade1Run(run)) {
      return { mode: "grade1", ok: false, reason: "invalid-run", runIndex };
    }
    const translated = run.kind === "braille-group"
      ? translateRuns(run.runs)
      : run.kind === "ligature"
        ? translateLigature(run)
        : translateTypeformedRun(run);
    if (!translated.ok) {
      return translated;
    }
    braille +=
      run.kind === "braille-group"
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

/** Translate the explicit document nodes that cannot be recovered from text. */
export function translateGrade1Runtime(input: Grade1Document): Grade1Result {
  return translateDocument(input);
}
