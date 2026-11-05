import type { IcebRuleCitation } from "./source.js";
import type { ContextualPrecedence, ContextualRuleGuard } from "./contextual-compiler.js";
import type { Grade2RuleKind } from "./grade2-rules.js";
import type { SymbolRuleSource } from "./symbols/compiler.js";

export interface PossessivePolicy {
  readonly suffixes: readonly string[];
  readonly endings: readonly { readonly ending: string; readonly suffixes: readonly string[] }[];
}

export interface ExpansionPolicy {
  readonly citation: IcebRuleCitation;
  readonly ids: {
    readonly contractionPrefix: string;
    readonly separator: string;
    readonly shortformPrefix: string;
    readonly longerSuffix: string;
    readonly appendixPrefix: string;
  };
  readonly shortformPrecedence: ContextualPrecedence;
  readonly longerPrecedence: ContextualPrecedence;
  readonly appendixPrecedence: ContextualPrecedence;
  readonly pluralSuffix: string;
  readonly shortformGuards: readonly ContextualRuleGuard[];
  readonly appendixGuards: readonly ContextualRuleGuard[];
  readonly collisionKinds: readonly Grade2RuleKind[];
  readonly standingWordKinds: readonly Grade2RuleKind[];
  readonly standingLiteralKinds: readonly Grade2RuleKind[];
  readonly latinKind: SymbolRuleSource["kind"];
  readonly latinPattern: string;
  readonly suffixExtensions: Readonly<Record<string, readonly string[]>>;
  readonly possessives: PossessivePolicy;
}
