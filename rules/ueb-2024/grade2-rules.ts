import { expansionTable } from "./expansion.js";
import { readExpandedGrade2Rule } from "./rule-json.js";
import type { IcebRuleCitation } from "./source.js";
import type { ContextualPrecedence, ContextualRuleGuard } from "./contextual-compiler.js";

/** Rule kinds are the keys of grade2-families.json. */
export type Grade2RuleKind = string;
export type Grade2RuleId = string;

export interface Grade2RuleSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation;
  readonly id: Grade2RuleId;
  readonly kind: Grade2RuleKind;
  readonly print: string;
  readonly guards: readonly ContextualRuleGuard[];
  readonly precedence: ContextualPrecedence;
  readonly variants: readonly Grade2RuleVariant[];
}

export interface Grade2RuleVariant {
  readonly idSuffix: string;
  readonly locator: string;
  readonly precedence: ContextualPrecedence;
  readonly guards: readonly ContextualRuleGuard[];
}

export const GRADE2_RULES: readonly Grade2RuleSource[] = expansionTable("grade2Rules").map(readExpandedGrade2Rule);
