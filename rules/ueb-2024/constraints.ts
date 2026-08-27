import {
  citeIceb,
  type Grade2ConstraintLocator,
  type IcebRuleCitation,
} from "./source.js";

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
    words: ["biofeedback", "microfilm", "microfilms", "twofold", "twofolds"],
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
    words: ["bead", "beads", "beauty"],
  },
  {
    citation: citeIceb("10.6.1"),
    contraction: "con",
    id: "UEB-10.6.1-con-syllable-exception",
    words: ["cone"],
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
    "hereford",
  ]),
  initialExceptions("10.7.5", "name", [
    "enamel", "ornament", "unamended", "vietnamese",
  ]),
  initialExceptions("10.7.6", "one", [
    "anemone", "baroness", "baronet", "boone", "cantonese", "colonel",
    "conestoga", "crooner", "donegal", "erroneous", "hermione", "indonesia",
    "krone", "monet", "onerous", "phonetic", "pioneer", "poisoned", "rhône",
    "rooney", "sooner", "stoned",
  ]),
  initialExceptions("10.7.7", "some", [
    "blossomed", "gasometer", "isometric", "ransomed", "somersault", "somerset",
  ]),
  initialExceptions("10.7.8", "time", [
    "altimeter", "centime", "centimeter", "mortimer", "multimedia", "sentiment",
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
    endings: ["eness", "iness"],
    groupsign: "ness",
    id: "UEB-10.8.4-ness-exception",
    words: [],
  },
];
