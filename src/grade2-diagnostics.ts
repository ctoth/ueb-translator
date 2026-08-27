import {
  GRADE2_RULE_IDS,
  type Grade2RuleId,
} from "./generated/ueb-2024/grade2-provenance.js";
import {
  translateGrade2Internal,
  type Grade2Document,
  type Grade2InvalidBoundary,
  type Grade2UnsupportedCharacter,
} from "./grade2.js";

export interface Grade2RuleTrace {
  readonly end: number;
  readonly id: Grade2RuleId;
  readonly print: string;
  readonly start: number;
}

export interface Grade2DiagnosticSuccess {
  readonly braille: string;
  readonly mode: "grade2";
  readonly ok: true;
  readonly rules: readonly Grade2RuleTrace[];
}

export type Grade2DiagnosticResult =
  | Grade2DiagnosticSuccess
  | Grade2InvalidBoundary
  | Grade2UnsupportedCharacter;

export function traceGrade2(
  input: string | Grade2Document,
): Grade2DiagnosticResult {
  const result = translateGrade2Internal(input);
  if (!result.ok) {
    return result;
  }
  return {
    braille: result.braille,
    mode: "grade2",
    ok: true,
    rules: result.rules.map((rule) => {
      const id = GRADE2_RULE_IDS[rule.ruleIndex];
      /* v8 ignore next -- generation aligns provenance with every runtime rule. */
      if (id === undefined) {
        throw new Error("Generated Grade 2 provenance is incomplete.");
      }
      return {
        end: rule.end,
        id,
        print: rule.print,
        start: rule.start,
      };
    }),
  };
}
