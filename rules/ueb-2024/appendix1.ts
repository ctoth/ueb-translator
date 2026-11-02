import appendix1Data from "./appendix1.json" with { type: "json" };
import { readAppendixRules } from "./rule-json.js";
import {
  type IcebRuleCitation,
  type ShortformLocator,
} from "./source.js";

export const APPENDIX1_BASES = ["about","above","according","across","after","afternoon","again","against","before","behind","below","beneath","between","blind","children","conceive","could","deceive","deceiving","declare","first","friend","good","him","immediate","letter","little","much","must","necessary","paid","perceive","perceiving","perhaps","quick","receive","receiving","rejoice","rejoicing","said","should","such","together","would","yourself"] as const;
export type Appendix1Base = (typeof APPENDIX1_BASES)[number];

export type Appendix1WordId<Base extends Appendix1Base = Appendix1Base> =
  `UEB-Appendix-1-${Base}-${string}`;

export interface Appendix1WordSource<Base extends Appendix1Base = Appendix1Base> {
  readonly base: Base;
  readonly citation: IcebRuleCitation<ShortformLocator>;
  readonly id: Appendix1WordId<Base>;
  readonly print: string;
}

export interface Appendix1GroupSource {
  readonly base: Appendix1Base;
  readonly words: readonly string[];
}

/** The explicitly listed longer words in the official 2024 Appendix 1. */
export const APPENDIX1_LONGER_WORDS: readonly Appendix1WordSource[] = readAppendixRules(appendix1Data, APPENDIX1_BASES);
