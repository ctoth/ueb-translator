import { expansionTable } from "./expansion.js";
import { readExpandedShortform } from "./rule-json.js";
import type { IcebRuleCitation } from "./source.js";

export type ShortformRuleId = string;

export interface ShortformSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation;
  readonly id: ShortformRuleId;
  readonly print: string;
}

export const SHORTFORMS: readonly ShortformSource[] = expansionTable("shortforms").map(readExpandedShortform);
