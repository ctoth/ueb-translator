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
export type Grade2ConstraintLocator =
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
  | Grade2ConstraintLocator
  | Grade2RuleLocator
  | ShortformLocator;

export interface IcebRuleCitation<
  Locator extends IcebRuleLocator = IcebRuleLocator,
> {
  readonly authority: "ICEB";
  readonly document: "Rules of Unified English Braille, Third Edition (2024)";
  readonly locator: Locator;
  readonly url: "https://iceb.org/publications/ueb/";
}

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
