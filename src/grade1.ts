import {
  translateGrade1Runtime,
  type Grade1Document,
  type Grade1Result,
  type Grade1TextResult,
} from "./grade1-runtime.js";
import { compose } from "./composition.js";
import {
  GRADE1_MODE_PROGRAM,
  GRADE1_SYMBOL_PROGRAM,
  UEB_COMPOSITION_POLICIES,
} from "./generated/ueb-2024/grade1-program.js";

export type {
  Grade1BrailleGroup,
  Grade1Document,
  Grade1InvalidLigature,
  Grade1InvalidRun,
  Grade1Ligature,
  Grade1Paragraph,
  Grade1Result,
  Grade1Run,
  Grade1Success,
  Grade1TextResult,
  Grade1TextRun,
  Grade1Typeform,
  Grade1UnsupportedCharacter,
} from "./grade1-runtime.js";

const GRADE1_TRANSLATOR = compose(
  GRADE1_SYMBOL_PROGRAM,
  GRADE1_MODE_PROGRAM,
  UEB_COMPOSITION_POLICIES,
);

/** Compose the generated symbol program with the closed mode runtime. */
export function translateGrade1(input: string): Grade1TextResult;
export function translateGrade1(input: string | Grade1Document): Grade1Result;
export function translateGrade1(input: string | Grade1Document): Grade1Result {
  if (typeof input !== "string") return translateGrade1Runtime(input);
  const result = GRADE1_TRANSLATOR.translate(input);
  return result.ok
    ? { braille: result.braille, mode: "grade1", ok: true }
    : result;
}
