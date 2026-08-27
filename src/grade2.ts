import {
  compose,
  type CompositionResult,
  type CompositionTextOptions,
} from "./composition.js";
import {
  type ContextualAppliedRule,
  type ContextualBoundary,
  type ContextualBoundaryKind,
} from "./contextual-transducer.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "./generated/ueb-2024/grade1-program.js";
import { GRADE2_PROGRAM } from "./generated/ueb-2024/grade2-program.js";
import {
  translateForeignLanguageRun,
  type ForeignLanguageRun,
} from "./foreign-language.js";
import {
  translateTypeformedText,
  type Grade1TextResult,
  type Grade1Typeform,
} from "./grade1-runtime.js";

export type {
  ForeignLanguage,
  ForeignLanguageCode,
  ForeignLanguageRun,
} from "./foreign-language.js";

export type Grade2BoundaryKind = ContextualBoundaryKind;
export type Grade2Boundary = ContextualBoundary;

export interface Grade2TextRun {
  readonly kind: "text";
  readonly text: string;
  readonly typeforms?: readonly Grade1Typeform[];
}

export interface Grade2WordRun {
  readonly boundaries?: readonly Grade2Boundary[];
  readonly kind: "word";
  readonly standing: "alone" | "joined";
  readonly text: string;
  readonly typeforms?: readonly Grade1Typeform[];
}

export type Grade2Run = ForeignLanguageRun | Grade2TextRun | Grade2WordRun;

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
  readonly runIndex?: number;
  readonly scalarIndex: number;
}

export interface Grade2DocumentUnsupportedCharacter
  extends Grade2UnsupportedCharacter {
  readonly runIndex: number;
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
export type Grade2DocumentResult =
  | Grade2DocumentUnsupportedCharacter
  | Grade2InvalidBoundary
  | Grade2Success;
export type Grade2TextResult = Grade2Success | Grade2UnsupportedCharacter;
export type Grade2AppliedRule = ContextualAppliedRule;

export interface Grade2InternalSuccess extends Grade2Success {
  readonly rules: readonly Grade2AppliedRule[];
}

export type Grade2InternalResult =
  | Grade2InternalSuccess
  | Grade2InvalidBoundary
  | Grade2UnsupportedCharacter;
export type Grade2InternalTextResult =
  | Grade2InternalSuccess
  | Grade2UnsupportedCharacter;
export type Grade2InternalDocumentResult =
  | Grade2DocumentUnsupportedCharacter
  | Grade2InternalSuccess
  | Grade2InvalidBoundary;

const GRADE2_TRANSLATOR = compose(
  GRADE1_SYMBOL_PROGRAM,
  GRADE1_MODE_PROGRAM,
  UEB_COMPOSITION_POLICIES,
  GRADE2_PROGRAM,
);

interface Grade2Offsets {
  readonly codeUnit: number;
  readonly scalar: number;
}

function adaptedResult(
  result: CompositionResult,
  offsets: Grade2Offsets,
): Grade2InternalTextResult {
  if (!result.ok) {
    return {
      ...result,
      codeUnitIndex: offsets.codeUnit + result.codeUnitIndex,
      mode: "grade2",
      scalarIndex: offsets.scalar + result.scalarIndex,
    };
  }
  return { braille: result.braille, mode: "grade2", ok: true, rules: result.rules };
}

function translateRun(
  run: Grade2Run,
  offsets: Grade2Offsets,
): Grade2InternalTextResult {
  if (run.kind === "foreign") {
    return adaptedResult(translateForeignLanguageRun(run), offsets);
  }
  const options: CompositionTextOptions = run.kind === "word"
    ? {
        ...(run.boundaries === undefined ? {} : { boundaries: run.boundaries }),
        globalOffset: offsets.codeUnit,
        standing: run.standing === "alone",
      }
    : { globalOffset: offsets.codeUnit };
  const raw = adaptedResult(
    GRADE2_TRANSLATOR.translate(run.text, options),
    offsets,
  );
  const typeforms = run.typeforms ?? [];
  if (!raw.ok || typeforms.length === 0) return raw;

  const typed = translateTypeformedText(
    { text: run.text, typeforms },
    (text, codeUnitOffset): Grade1TextResult => {
      const boundaries = options.boundaries
        ?.filter((boundary) =>
          boundary.at > codeUnitOffset &&
          boundary.at < codeUnitOffset + text.length
        )
        .map((boundary) => ({
          at: boundary.at - codeUnitOffset,
          kind: boundary.kind,
        }));
      const translated = GRADE2_TRANSLATOR.translate(text, {
        ...options,
        ...(boundaries === undefined ? {} : { boundaries }),
        globalOffset: offsets.codeUnit + codeUnitOffset,
      });
      /* v8 ignore next -- the same complete run parsed successfully above. */
      if (!translated.ok) return translated;
      return { braille: translated.braille, mode: "grade1", ok: true };
    },
  );
  /* v8 ignore next -- the callback cannot fail after the complete run parsed. */
  if (!typed.ok) return { ...typed, mode: "grade2" };
  return { ...raw, braille: typed.braille };
}

function translateDocument(
  document: Grade2Document,
): Grade2InternalDocumentResult {
  let braille = "";
  let codeUnitOffset = 0;
  let scalarOffset = 0;
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
    const translated = translateRun(run, {
      codeUnit: codeUnitOffset,
      scalar: scalarOffset,
    });
    if (!translated.ok) {
      return { ...translated, runIndex };
    }
    braille += translated.braille;
    rules.push(...translated.rules);
    codeUnitOffset += run.text.length;
    scalarOffset += Array.from(run.text).length;
  }
  return { braille, mode: "grade2", ok: true, rules };
}

export function translateGrade2Internal(input: string): Grade2InternalTextResult;
export function translateGrade2Internal(
  input: Grade2Document,
): Grade2InternalDocumentResult;
export function translateGrade2Internal(
  input: string | Grade2Document,
): Grade2InternalResult;
export function translateGrade2Internal(
  input: string | Grade2Document,
): Grade2InternalResult {
  return typeof input === "string"
    ? adaptedResult(GRADE2_TRANSLATOR.translate(input), { codeUnit: 0, scalar: 0 })
    : translateDocument(input);
}

/** Translate print with the compiled Grade 1 packages plus contractions. */
export function translateGrade2(input: string): Grade2TextResult;
export function translateGrade2(input: Grade2Document): Grade2DocumentResult;
export function translateGrade2(input: string | Grade2Document): Grade2Result {
  const result = translateGrade2Internal(input);
  return result.ok
    ? { braille: result.braille, mode: "grade2", ok: true }
    : result;
}
