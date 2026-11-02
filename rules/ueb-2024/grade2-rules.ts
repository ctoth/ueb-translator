import {
  citeIceb,
  type IcebRuleCitation,
} from "./source.js";
import type { ContextualPrecedence, ContextualRuleGuard } from "./contextual-compiler.js";

export type Grade2RuleKind =
  | "alphabetic-wordsign"
  | "final-letter-groupsign"
  | "initial-letter-contraction"
  | "lower-groupsign"
  | "lower-wordsign"
  | "strong-contraction"
  | "strong-groupsign"
  | "strong-wordsign";

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

export const GRADE2_RULE_LOCATOR_BY_KIND: Grade2RuleLocatorByKind = {
  "alphabetic-wordsign": "10.1",
  "final-letter-groupsign": "10.8",
  "initial-letter-contraction": "10.7",
  "lower-groupsign": "10.6",
  "lower-wordsign": "10.5",
  "strong-contraction": "10.3",
  "strong-groupsign": "10.4",
  "strong-wordsign": "10.2",
};

type Grade2RuleLocatorFor<Kind extends Grade2RuleKind> =
  (typeof GRADE2_RULE_LOCATOR_BY_KIND)[Kind];
export type Grade2RuleId<Kind extends Grade2RuleKind = Grade2RuleKind> =
  `UEB-${Grade2RuleLocatorFor<Kind>}-${string}`;

interface Grade2RuleSourceFor<Kind extends Grade2RuleKind> {
  readonly braille: string;
  readonly citation: IcebRuleCitation<Grade2RuleLocatorFor<Kind>>;
  readonly id: Grade2RuleId<Kind>;
  readonly kind: Kind;
  readonly print: string;
  readonly guards: readonly ContextualRuleGuard[];
  readonly precedence: ContextualPrecedence;
}

export type Grade2RuleSource = {
  readonly [Kind in Grade2RuleKind]: Grade2RuleSourceFor<Kind>;
}[Grade2RuleKind];

const rules = <const Kind extends Grade2RuleKind>(
  kind: Kind,
  precedence: ContextualPrecedence,
  entries: readonly (readonly [print: string, braille: string])[],
  guards: readonly ContextualRuleGuard[] = [],
): readonly Grade2RuleSourceFor<Kind>[] => {
  const locator = GRADE2_RULE_LOCATOR_BY_KIND[kind];
  return entries.map(([print, braille]) => ({
    braille,
    citation: citeIceb(locator),
    id: `UEB-${locator}-${print}`,
    kind,
    print,
    guards,
    precedence,
  }));
};

export const GRADE2_RULES: readonly Grade2RuleSource[] = [
  ...rules("alphabetic-wordsign", 0, [
    ["but", "⠃"], ["can", "⠉"], ["do", "⠙"], ["every", "⠑"],
    ["from", "⠋"], ["go", "⠛"], ["have", "⠓"], ["just", "⠚"],
    ["knowledge", "⠅"], ["like", "⠇"], ["more", "⠍"],
    ["not", "⠝"], ["people", "⠏"], ["quite", "⠟"],
    ["rather", "⠗"], ["so", "⠎"], ["that", "⠞"], ["us", "⠥"],
    ["very", "⠧"], ["it", "⠭"], ["you", "⠽"], ["as", "⠵"],
    ["will", "⠺"],
  ]),
  ...rules("strong-wordsign", 0, [
    ["child", "⠡"], ["shall", "⠩"], ["this", "⠹"],
    ["which", "⠱"], ["out", "⠳"], ["still", "⠌"],
  ]),
  ...rules("strong-contraction", 0, [
    ["and", "⠯"], ["for", "⠿"], ["of", "⠷"], ["the", "⠮"],
    ["with", "⠾"],
  ]),
  ...rules("strong-groupsign", 2, [
    ["ch", "⠡"], ["gh", "⠣"], ["sh", "⠩"], ["th", "⠹"],
    ["wh", "⠱"], ["ed", "⠫"], ["er", "⠻"], ["ou", "⠳"],
    ["ow", "⠪"], ["st", "⠌"], ["ing", "⠬"], ["ar", "⠜"],
  ]),
  // Preserve the existing following-mode restriction for the be wordsign too.
  ...rules("lower-wordsign", 0, [
    ["be", "⠆"],
  ], [{ kind: "stable-following-modes" }]),
  ...rules("lower-wordsign", 0, [
    ["enough", "⠢"], ["were", "⠶"],
    ["his", "⠦"], ["in", "⠔"], ["was", "⠴"],
  ]),
  // ICEB 10.6.3: retain the following mode boundary.
  ...rules("lower-groupsign", 1, [
    ["be", "⠆"], ["con", "⠒"], ["dis", "⠲"],
  ], [{ kind: "stable-following-modes" }]),
  // ICEB 10.6.6: retain both adjacent mode boundaries.
  ...rules("lower-groupsign", 3, [
    ["ea", "⠂"], ["bb", "⠆"], ["cc", "⠒"], ["ff", "⠖"], ["gg", "⠶"],
  ], [{ kind: "stable-adjacent-modes" }]),
  ...rules("lower-groupsign", 3, [
    ["en", "⠢"], ["in", "⠔"],
  ]),
  ...rules("initial-letter-contraction", 4, [
    ["upon", "⠘⠥"], ["these", "⠘⠮"], ["those", "⠘⠹"],
    ["whose", "⠘⠱"], ["word", "⠘⠺"], ["cannot", "⠸⠉"],
    ["had", "⠸⠓"], ["many", "⠸⠍"], ["spirit", "⠸⠎"],
    ["their", "⠸⠮"], ["world", "⠸⠺"], ["day", "⠐⠙"],
    ["ever", "⠐⠑"], ["father", "⠐⠋"], ["here", "⠐⠓"],
    ["know", "⠐⠅"], ["lord", "⠐⠇"], ["mother", "⠐⠍"],
    ["name", "⠐⠝"], ["one", "⠐⠕"], ["part", "⠐⠏"],
    ["question", "⠐⠟"], ["right", "⠐⠗"], ["some", "⠐⠎"],
    ["time", "⠐⠞"], ["under", "⠐⠥"], ["young", "⠐⠽"],
    ["there", "⠐⠮"], ["character", "⠐⠡"],
    ["through", "⠐⠹"], ["where", "⠐⠱"], ["ought", "⠐⠳"],
    ["work", "⠐⠺"],
  ]),
  ...rules("final-letter-groupsign", 5, [
    ["ound", "⠨⠙"], ["ance", "⠨⠑"], ["sion", "⠨⠝"],
    ["less", "⠨⠎"], ["ount", "⠨⠞"], ["ence", "⠰⠑"],
    ["ong", "⠰⠛"], ["ful", "⠰⠇"], ["tion", "⠰⠝"],
    ["ness", "⠰⠎"], ["ment", "⠰⠞"], ["ity", "⠰⠽"],
  ]),
];
