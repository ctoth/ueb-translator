import {
  citeIceb,
  type Grade2ConstraintLocator,
  type IcebRuleCitation,
} from "./source.js";

// Expand only reviewed, spelling-preserving suffixes. This is source data for
// the cited restriction, not a general stemmer: arbitrary derivation can change
// pronunciation or syllable boundaries (e.g. Monet versus monetary, 10.7.6).
function family(base: string, suffixes: readonly string[]): readonly string[] {
  return [base, ...suffixes.map((suffix) => base + suffix)];
}

export interface CompoundContractionExceptionSource {
  readonly citation: IcebRuleCitation<"10.3.1">;
  readonly contraction: "of" | "the";
  readonly id: `UEB-10.3.1-${"of" | "the"}-compound-exception`;
  readonly words: readonly string[];
}

export const COMPOUND_CONTRACTION_EXCEPTIONS: readonly CompoundContractionExceptionSource[] = [
  {
    citation: citeIceb("10.3.1"),
    contraction: "of",
    id: "UEB-10.3.1-of-compound-exception",
    words: [
      "biofeedback", ...family("microfilm", ["s", "ed", "ing"]),
      "twofold", "twofolds",
    ],
  },
  {
    citation: citeIceb("10.3.1"),
    contraction: "the",
    id: "UEB-10.3.1-the-compound-exception",
    words: ["apartheid", "northeast", "northeastern"],
  },
];

export interface FirstSyllableContractionExceptionSource {
  readonly citation: IcebRuleCitation<"10.6.1">;
  readonly contraction: "be" | "con" | "dis";
  readonly id: `UEB-10.6.1-${"be" | "con" | "dis"}-syllable-exception`;
  readonly words: readonly string[];
}

export const FIRST_SYLLABLE_CONTRACTION_EXCEPTIONS: readonly FirstSyllableContractionExceptionSource[] = [
  {
    citation: citeIceb("10.6.1"),
    contraction: "be",
    id: "UEB-10.6.1-be-syllable-exception",
    words: [
      ...family("bead", ["s", "ed", "ing"]), "beauty",
      "been", ...family("beautiful", ["ly"]),
      ...family("beat", ["s", "en", "er", "ers", "ing", "ings"]),
      ...family("bear", ["s", "er", "ers", "ing", "ings"]),
      ...family("bed", ["s", "ded", "ding"]),
      ...family("beep", ["s", "ed", "ing"]),
      ...family("better", ["s", "ed", "ing"]), "belfast",
      ...family("bend", ["s", "er", "ers", "ing"]), "bent",
      ...family("bedrock", ["s"]), ...family("bedroom", ["s"]),
      ...family("best", ["s", "ed", "ing"]), "benfica",
    ],
  },
  {
    citation: citeIceb("10.6.1"),
    contraction: "dis",
    id: "UEB-10.6.1-dis-syllable-exception",
    words: family("dish", ["es"]),
  },
  {
    citation: citeIceb("10.6.1"),
    contraction: "con",
    id: "UEB-10.6.1-con-syllable-exception",
    words: [...family("cone", ["s"]), "conan"],
  },
];

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

const initialExceptions = (
  locator: Grade2ConstraintLocator,
  contraction: ContextualInitialContraction,
  words: readonly string[],
): InitialContractionExceptionSource => ({
  citation: citeIceb(locator),
  contraction,
  id: `UEB-${locator}-${contraction}-exception`,
  words,
});

export const INITIAL_CONTRACTION_EXCEPTIONS: readonly InitialContractionExceptionSource[] = [
  initialExceptions("10.7.2", "upon", ["coupon", "dupont"]),
  initialExceptions("10.7.2", "these", ["hypotheses", "theseus"]),
  initialExceptions("10.7.2", "those", ["spathose", "thoseby"]),
  initialExceptions("10.7.2", "whose", ["withered"]),
  initialExceptions("10.7.2", "there", [
    "bothered", "ethereal", "isothere", "smithereens", "theresa",
  ]),
  initialExceptions("10.7.3", "had", [
    "chad", "hades", "hadrian", "menhaden", "shadow", "thaddeus",
  ]),
  initialExceptions("10.7.4", "ever", [
    "believer", "eversion", "guinevere", "mckeever", "monteverdi",
    "persevere", "reverberate", "revere", "reverify", "severity", "thievery",
  ]),
  initialExceptions("10.7.5", "here", [
    "adhered", "bothered", "coherence", "elsewhere", "ethereal", "heredity",
    "hereford", "hereditary",
  ]),
  initialExceptions("10.7.5", "name", [
    ...family("enamel", ["s", "ed", "ing", "led", "ling"]),
    ...family("ornament", ["s", "ed", "ing", "al"]), "unamended", "vietnamese",
  ]),
  initialExceptions("10.7.6", "one", [
    ...family("anemone", ["s"]), "baroness", ...family("baronet", ["s"]),
    "boone", "cantonese",
    ...family("colonel", ["s"]),
    "conestoga", "crooner", "donegal", "erroneous", "hermione", "indonesia",
    "krone", "monet", "onerous", "phonetic", "pioneer", "poisoned", "rhône",
    "rooney", "sooner", "stoned",
  ]),
  initialExceptions("10.7.7", "some", [
    "blossomed", ...family("gasometer", ["s"]), "isometric", "ransomed",
    ...family("somersault", ["s", "ed", "ing"]), "somerset",
  ]),
  initialExceptions("10.7.8", "time", [
    ...family("altimeter", ["s"]), ...family("centime", ["s"]),
    ...family("centimeter", ["s"]), "mortimer", "multimedia",
    ...family("multimeter", ["s"]),
    ...family("sentiment", ["s", "al", "ally", "ality"]),
  ]),
  initialExceptions("10.7.9", "under", [
    "flounder", "laundering", "saunders", "underived", "underogatory",
  ]),
];

export interface FinalGroupsignExceptionSource {
  readonly citation: IcebRuleCitation<"10.8.3" | "10.8.4">;
  readonly groupsign: "ity" | "ness";
  readonly id: "UEB-10.8.3-ity-exception" | "UEB-10.8.4-ness-exception";
  readonly endings: readonly string[];
  readonly words: readonly string[];
}

export const FINAL_GROUPSIGN_EXCEPTIONS: readonly FinalGroupsignExceptionSource[] = [
  {
    citation: citeIceb("10.8.3"),
    endings: [],
    groupsign: "ity",
    id: "UEB-10.8.3-ity-exception",
    words: ["biscuity", "dacoity", "fruity", "hoitytoity", "rabbity"],
  },
  {
    citation: citeIceb("10.8.4"),
    endings: [],
    groupsign: "ness",
    id: "UEB-10.8.4-ness-exception",
    words: [
      "captainess", "chieftainess", "citizeness", "heatheness", "villainess",
    ].flatMap((word) => family(word, ["es"])),
  },
];
