import { sourceData } from "./source-manifest.js";
import { GRADE2_RULES, type Grade2RuleKind } from "./grade2-rules.js";
import { readConstraints } from "./rule-json.js";
import type { Grade2ConstraintLocator, IcebRuleCitation } from "./source.js";
import type { ContextualRuleGuard } from "./contextual-compiler.js";

/** Reviewed finite concatenation; never a stemmer or inferred morphology. */
export interface WordFamilySource {
  readonly base: string;
  readonly suffixes: readonly string[];
}

export interface ConstraintSource {
  readonly citation: IcebRuleCitation<Grade2ConstraintLocator>;
  readonly target: { readonly kind: Grade2RuleKind; readonly print: string };
  readonly guards: readonly ContextualRuleGuard[];
}

export const CONSTRAINTS: readonly ConstraintSource[] = readConstraints(sourceData("constraints"), GRADE2_RULES);
