import { expansionTable } from "./expansion.js";
import { readExpandedConstraint } from "./rule-json.js";
import type { Grade2RuleKind } from "./grade2-rules.js";
import type { RuleCitation } from "./source.js";
import type { ContextualRuleGuard } from "./contextual-compiler.js";

export interface ConstraintSource {
  readonly citation: RuleCitation;
  readonly target: { readonly kind: Grade2RuleKind; readonly print: string };
  readonly guards: readonly ContextualRuleGuard[];
}

export const CONSTRAINTS: readonly ConstraintSource[] = expansionTable("constraints").map(readExpandedConstraint);
