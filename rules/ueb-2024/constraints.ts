import compoundExceptionsData from "./compound-exceptions.json" with { type: "json" };
import syllableExceptionsData from "./syllable-exceptions.json" with { type: "json" };
import syllableVowelWordsData from "./syllable-vowel-words.json" with { type: "json" };
import initialExceptionsData from "./initial-exceptions.json" with { type: "json" };
import finalExceptionsData from "./final-exceptions.json" with { type: "json" };
import { readCompoundExceptions, readSyllableExceptions, readVowelWords, readInitialExceptions, readFinalExceptions } from "./rule-json.js";
import type { Grade2ConstraintLocator, IcebRuleCitation } from "./source.js";

// Expand only reviewed, spelling-preserving suffixes. This is source data for
// the cited restriction, not a general stemmer: arbitrary derivation can change
// pronunciation or syllable boundaries (e.g. Monet versus monetary, 10.7.6).

/** Reviewed suffix expansion in authored JSON, never a general stemmer. */
export interface WordFamilySource {
  readonly base: string;
  readonly suffixes: readonly string[];
}

export interface CompoundContractionExceptionSource {
  readonly citation: IcebRuleCitation<"10.3.1">;
  readonly contraction: "of" | "the";
  readonly id: `UEB-10.3.1-${"of" | "the"}-compound-exception`;
  readonly words: readonly string[];
}

export const COMPOUND_CONTRACTION_EXCEPTIONS: readonly CompoundContractionExceptionSource[] = readCompoundExceptions(compoundExceptionsData);

export interface FirstSyllableContractionExceptionSource {
  readonly citation: IcebRuleCitation<"10.6.1">;
  readonly contraction: "be" | "con" | "dis";
  readonly id: `UEB-10.6.1-${"be" | "con" | "dis"}-syllable-exception`;
  readonly words: readonly string[];
}

export const FIRST_SYLLABLE_CONTRACTION_EXCEPTIONS: readonly FirstSyllableContractionExceptionSource[] = readSyllableExceptions(syllableExceptionsData);

export interface FirstSyllableVowelWordsSource {
  readonly citation: IcebRuleCitation<"10.6.1">;
  readonly contraction: "be";
  readonly id: "UEB-10.6.1-be-vowel-syllable-words";
  readonly words: readonly string[];
}

/**
 * ICEB 10.6.1 uses be only when it forms the first syllable. Before a vowel or
 * y it usually does not (bee, beef, beach), so be is spelled there unless the
 * word is listed here: words whose be is its own syllable (be·ing, be·yond,
 * be·a·ti·tude, be- prefixes). Unlisted and unknown words are spelled, which
 * keeps contrived words unambiguous (#100).
 */
export const FIRST_SYLLABLE_VOWEL_WORDS: FirstSyllableVowelWordsSource = readVowelWords(syllableVowelWordsData);

export type ContextualInitialContraction =
  | "ever"
  | "had"
  | "here"
  | "name"
  | "one"
  | "some"
  | "there"
  | "these"
  | "those"
  | "time"
  | "under"
  | "upon"
  | "whose";

export interface InitialContractionExceptionSource {
  readonly citation: IcebRuleCitation<Grade2ConstraintLocator>;
  readonly contraction: ContextualInitialContraction;
  readonly id: `UEB-${Grade2ConstraintLocator}-${ContextualInitialContraction}-exception`;
  readonly words: readonly string[];
}

export const INITIAL_CONTRACTION_EXCEPTIONS: readonly InitialContractionExceptionSource[] = readInitialExceptions(initialExceptionsData);

export interface FinalGroupsignExceptionSource {
  readonly citation: IcebRuleCitation<"10.8.3" | "10.8.4">;
  readonly groupsign: "ity" | "ness";
  readonly id: "UEB-10.8.3-ity-exception" | "UEB-10.8.4-ness-exception";
  readonly endings: readonly string[];
  readonly words: readonly string[];
}

export const FINAL_GROUPSIGN_EXCEPTIONS: readonly FinalGroupsignExceptionSource[] = readFinalExceptions(finalExceptionsData);
