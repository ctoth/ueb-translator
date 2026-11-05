import { sourceData } from "./source-manifest.js";
import { readShortforms } from "./rule-json.js";
import type { IcebRuleCitation } from "./source.js";

export type ShortformRuleId = string;

export interface ShortformSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation;
  readonly id: ShortformRuleId;
  readonly print: string;
}

export const SHORTFORMS: readonly ShortformSource[] = readShortforms(sourceData("shortforms"));
