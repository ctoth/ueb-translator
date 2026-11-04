import { sourceData } from "./source-manifest.js";
import { readShortforms } from "./rule-json.js";
import {
  type IcebRuleCitation,
  type ShortformLocator,
} from "./source.js";

export type ShortformRuleId = `UEB-10.9-${string}`;

export interface ShortformSource {
  readonly braille: string;
  readonly citation: IcebRuleCitation<ShortformLocator>;
  readonly id: ShortformRuleId;
  readonly print: string;
}

export const SHORTFORMS: readonly ShortformSource[] = readShortforms(sourceData("shortforms"));
