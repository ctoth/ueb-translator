import { sourceData } from "./source-manifest.js";
import { readGrade2Rules, readGrade2Families } from "./rule-json.js";
import type { IcebRuleCitation, Grade2ConstraintLocator } from "./source.js";
import type { ContextualPrecedence, ContextualRuleGuard } from "./contextual-compiler.js";

export const GRADE2_RULE_KINDS = ["alphabetic-wordsign","final-letter-groupsign","initial-letter-contraction","lower-groupsign","lower-wordsign","strong-contraction","strong-groupsign","strong-wordsign"] as const;
export type Grade2RuleKind = (typeof GRADE2_RULE_KINDS)[number];

export interface Grade2RuleLocatorByKind {
  readonly "alphabetic-wordsign": "10.1";
  readonly "final-letter-groupsign": "10.8";
  readonly "initial-letter-contraction": "10.7";
  readonly "lower-groupsign": "10.6";
  readonly "lower-wordsign": "10.5";
  readonly "strong-contraction": "10.3";
  readonly "strong-groupsign": "10.4";
  readonly "strong-wordsign": "10.2";
}

export type Grade2RuleFamilies = {
  readonly [Kind in Grade2RuleKind]: {
    readonly locator: Grade2RuleLocatorByKind[Kind];
    readonly guards: readonly ContextualRuleGuard[];
  };
};

export const GRADE2_RULE_FAMILIES: Grade2RuleFamilies = readGrade2Families(sourceData("families"));

type Grade2RuleLocatorFor<Kind extends Grade2RuleKind> =
  Grade2RuleLocatorByKind[Kind];
export type Grade2RuleId = string;

export interface Grade2RuleSourceFor<Kind extends Grade2RuleKind> {
  readonly braille: string;
  readonly citation: IcebRuleCitation<Grade2RuleLocatorFor<Kind>>;
  readonly id: Grade2RuleId;
  readonly kind: Kind;
  readonly print: string;
  readonly guards: readonly ContextualRuleGuard[];
  readonly precedence: ContextualPrecedence;
  readonly variants: readonly Grade2RuleVariant[];
}

export interface Grade2RuleVariant {
  readonly idSuffix: string;
  readonly locator: Grade2ConstraintLocator;
  readonly precedence: ContextualPrecedence;
  readonly guards: readonly ContextualRuleGuard[];
}

export type Grade2RuleSource = {
  readonly [Kind in Grade2RuleKind]: Grade2RuleSourceFor<Kind>;
}[Grade2RuleKind];

/** Authored JSON groups; the compiler expands citations and stable rule IDs. */
export interface Grade2RuleGroupSource {
  readonly kind: Grade2RuleKind;
  readonly precedence: ContextualPrecedence;
  readonly entries: readonly (readonly [print: string, braille: string])[];
  readonly guards: readonly ContextualRuleGuard[];
  readonly variants: readonly Grade2RuleVariant[];
}

export const GRADE2_RULES: readonly Grade2RuleSource[] = readGrade2Rules(sourceData("groups"), GRADE2_RULE_KINDS, GRADE2_RULE_FAMILIES);
