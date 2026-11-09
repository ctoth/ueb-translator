import { expansionTable } from "./expansion.js";
import { readExpandedAppendixWord } from "./rule-json.js";
import type { IcebRuleCitation } from "./source.js";

export type Appendix1WordId = string;

export interface Appendix1WordSource {
  readonly base: string;
  readonly citation: IcebRuleCitation;
  readonly id: Appendix1WordId;
  readonly print: string;
}

/** The explicitly listed longer words in the official 2024 Appendix 1. */
export const APPENDIX1_LONGER_WORDS: readonly Appendix1WordSource[] = expansionTable("appendix").map(readExpandedAppendixWord);
