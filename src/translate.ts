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
  translateTechnical,
  translateTechnicalText,
  type TechnicalDocument,
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

export interface TechnicalTextInput {
  readonly kind: "technical-text";
  readonly text: string;
}

export type TechnicalInput = TechnicalDocument | TechnicalTextInput;

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
      switch (request.input.kind) {
        case "technical-document":
          return translateTechnical(request.input);
        case "technical-text":
          return translateTechnicalText(request.input.text);
      }
  }
}
