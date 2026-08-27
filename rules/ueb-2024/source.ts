export type Grade2RuleLocator =
  | "10.1"
  | "10.2"
  | "10.3"
  | "10.4"
  | "10.5"
  | "10.6"
  | "10.7"
  | "10.8";

export type ShortformLocator = "10.9 and Appendix 1";
export type CompositionPolicyLocator = "2.6" | "10.5";
export type Grade1RuleLocator =
  | "3"
  | "4.1.1"
  | "4.2.1"
  | "4.3"
  | "4.4.1"
  | "4.5.1"
  | "4.6.1"
  | "5"
  | "6.1.1"
  | "6.1-6.5"
  | "7"
  | "8.3-8.6"
  | "9.2-9.4"
  | `Symbols list: U+${string}`;
export type Grade2ConstraintLocator =
  | "10.3.1"
  | "10.6.1"
  | "10.10"
  | "10.7.2"
  | "10.7.3"
  | "10.7.4"
  | "10.7.5"
  | "10.7.6"
  | "10.7.7"
  | "10.7.8"
  | "10.7.9"
  | "10.8.3"
  | "10.8.4";
export type IcebRuleLocator =
  | Grade1RuleLocator
  | Grade2ConstraintLocator
  | Grade2RuleLocator
  | CompositionPolicyLocator
  | ShortformLocator;

export interface RuleCitation<
  Authority extends string = string,
  Document extends string = string,
  Locator extends string = string,
  Url extends string = string,
> {
  readonly authority: Authority;
  readonly document: Document;
  readonly locator: Locator;
  readonly url: Url;
}

export type IcebRuleCitation<
  Locator extends IcebRuleLocator = IcebRuleLocator,
> = RuleCitation<
  "ICEB",
  "Rules of Unified English Braille, Third Edition (2024)",
  Locator,
  "https://iceb.org/publications/ueb/"
>;

export function citeIceb<const Locator extends IcebRuleLocator>(
  locator: Locator,
): IcebRuleCitation<Locator> {
  return {
    authority: "ICEB",
    document: "Rules of Unified English Braille, Third Edition (2024)",
    locator,
    url: "https://iceb.org/publications/ueb/",
  };
}
