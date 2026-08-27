import {
  translateGrade1Runtime,
  type Grade1Document,
  type Grade1Result,
  type Grade1TextResult,
} from "./grade1-runtime.js";

export type {
  Grade1BrailleGroup,
  Grade1Document,
  Grade1InvalidLigature,
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

/** Compose the generated symbol program with the closed mode runtime. */
export function translateGrade1(input: string): Grade1TextResult;
export function translateGrade1(input: Grade1Document): Grade1Result;
export function translateGrade1(input: string | Grade1Document): Grade1Result {
  return typeof input === "string"
    ? translateGrade1Runtime(input)
    : translateGrade1Runtime(input);
}
