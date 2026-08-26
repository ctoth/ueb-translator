import {
  translateGrade1,
  type Grade1Document,
  type Grade1Result,
} from "./grade1.js";
import {
  translateGrade2,
  type Grade2Document,
  type Grade2Result,
} from "./grade2.js";
import {
  translateTechnicalInput,
  type TechnicalInput,
  type TechnicalResult,
  type TechnicalTextResult,
} from "./technical.js";

export interface Grade1TranslationRequest {
  readonly input: Grade1Document | string;
  readonly mode: "grade1";
}

export interface Grade2TranslationRequest {
  readonly input: Grade2Document | string;
  readonly mode: "grade2";
}

export interface TechnicalTranslationRequest {
  readonly input: TechnicalInput;
  readonly mode: "technical";
}

export type UebTranslationRequest =
  | Grade1TranslationRequest
  | Grade2TranslationRequest
  | TechnicalTranslationRequest;

export type UebTranslationMode = UebTranslationRequest["mode"];

export type UebTranslationResult =
  | Grade1Result
  | Grade2Result
  | TechnicalResult
  | TechnicalTextResult;

/** Dispatch one explicitly selected UEB forward-translation mode. */
export function translateUeb(
  request: UebTranslationRequest,
): UebTranslationResult {
  switch (request.mode) {
    case "grade1":
      return typeof request.input === "string"
        ? translateGrade1(request.input)
        : translateGrade1(request.input);
    case "grade2":
      return typeof request.input === "string"
        ? translateGrade2(request.input)
        : translateGrade2(request.input);
    case "technical":
      return translateTechnicalInput(request.input);
  }
}
