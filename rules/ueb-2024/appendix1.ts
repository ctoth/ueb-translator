import {
  citeIceb,
  type IcebRuleCitation,
  type ShortformLocator,
} from "./source.js";

export type Appendix1Base =
  | "about"
  | "above"
  | "according"
  | "across"
  | "after"
  | "afternoon"
  | "again"
  | "against"
  | "before"
  | "behind"
  | "below"
  | "beneath"
  | "between"
  | "blind"
  | "children"
  | "conceive"
  | "could"
  | "deceive"
  | "deceiving"
  | "declare"
  | "first"
  | "friend"
  | "good"
  | "him"
  | "immediate"
  | "letter"
  | "little"
  | "much"
  | "must"
  | "necessary"
  | "paid"
  | "perceive"
  | "perceiving"
  | "perhaps"
  | "quick"
  | "receive"
  | "receiving"
  | "rejoice"
  | "rejoicing"
  | "said"
  | "should"
  | "such"
  | "together"
  | "would"
  | "yourself";

export type Appendix1WordId<Base extends Appendix1Base = Appendix1Base> =
  `UEB-Appendix-1-${Base}-${string}`;

export interface Appendix1WordSource<Base extends Appendix1Base = Appendix1Base> {
  readonly base: Base;
  readonly citation: IcebRuleCitation<ShortformLocator>;
  readonly id: Appendix1WordId<Base>;
  readonly print: string;
}

const words = <const Base extends Appendix1Base>(
  base: Base,
  longerWords: readonly string[],
): readonly Appendix1WordSource<Base>[] => longerWords.map((print) => ({
  base,
  citation: citeIceb("10.9 and Appendix 1"),
  id: `UEB-Appendix-1-${base}-${print}`,
  print,
}));

/** The explicitly listed longer words in the official 2024 Appendix 1. */
export const APPENDIX1_LONGER_WORDS: readonly Appendix1WordSource[] = [
  ...words("about", [
    "aboutface", "aboutfaced", "aboutfacer", "aboutfacing", "aboutturn",
    "aboutturned", "eastabout", "gadabout", "hereabout", "knockabout",
    "layabout", "northabout", "rightabout", "roundabout", "roustabout",
    "runabout", "southabout", "stirabout", "thereabout", "turnabout",
    "walkabout", "westabout", "whereabout",
  ]),
  ...words("above", [
    "aboveboard", "aboveground", "abovementioned", "hereinabove",
  ]),
  ...words("according", ["accordingly", "unaccording", "unaccordingly"]),
  ...words("across", ["readacross"]),
  ...words("after", [
    "afterbattle", "afterbirth", "afterbreakfast", "afterburn",
    "afterburned", "afterburner", "afterburning", "aftercare", "afterclap",
    "aftercoffee", "afterdamp", "afterdark", "afterdeck", "afterdinner",
    "afterflow", "aftergame", "afterglow", "afterguard", "afterhatch",
    "afterhatches", "afterhour", "afterlife", "afterlight", "afterlives",
    "afterlunch", "afterlunches", "aftermarket", "aftermatch",
    "aftermatches", "aftermath", "aftermeeting", "aftermentioned",
    "aftermidday", "aftermidnight", "aftermost", "afterpain", "afterparties",
    "afterparty", "afterpiece", "afterplay", "aftersale", "afterschool",
    "aftersensation", "aftershave", "aftershock", "aftershow", "aftershower",
    "aftersupper", "aftertaste", "aftertax", "aftertaxes", "aftertea",
    "aftertheater", "aftertheatre", "afterthought", "aftertime",
    "aftertreatment", "afterword", "afterwork", "afterworld", "hereafter",
    "hereinafter", "morningafter", "thereafter", "thereinafter", "whereafter",
    "whereinafter",
  ]),
  ...words("afternoon", ["afternoontea", "goodafternoon", "midafternoon"]),
  ...words("again", [
    "hereagain", "hereinagain", "thereagain", "thereinagain", "whereagain",
    "whereinagain",
  ]),
  ...words("against", ["hereagainst", "thereagainst", "whereagainst"]),
  ...words("before", ["beforehand", "beforementioned"]),
  ...words("behind", ["behindhand"]),
  ...words("below", ["belowdeck", "belowground", "belowmentioned"]),
  ...words("beneath", ["beneathdeck", "beneathground"]),
  ...words("between", ["betweendeck", "betweentime", "betweenwhile"]),
  ...words("blind", [
    "colorblind", "colorblindness", "colorblindnesses", "colourblind",
    "colourblindness", "colourblindnesses", "deafblind", "deafblindness",
    "deafblindnesses", "purblind", "purblindly", "purblindness",
    "purblindnesses", "snowblind", "snowblindness", "snowblindnesses",
    "unblindfold", "unblindfolded", "unblindfolding",
  ]),
  ...words("children", ["children'swear"]),
  ...words("conceive", ["conceived", "conceiver"]),
  ...words("could", [
    "coulda", "couldest", "couldn't", "couldn't've", "couldst", "could've",
  ]),
  ...words("deceive", [
    "archdeceiver", "deceived", "deceiver", "undeceive", "undeceived",
    "undeceiver",
  ]),
  ...words("deceiving", ["undeceiving"]),
  ...words("declare", ["declared", "declarer", "undeclare", "undeclared"]),
  ...words("first", ["feetfirst", "firstaid", "firstaider", "headfirst", "tailfirst"]),
  ...words("friend", [
    "befriend", "boyfriend", "defriend", "galfriend", "gentlemanfriend",
    "gentlemenfriends", "girlfriend", "guyfriend", "ladyfriend", "manfriend",
    "menfriends", "penfriend", "schoolfriend", "unfriend", "unfriendlier",
    "unfriendliest", "unfriendliness", "unfriendlinesses", "unfriendly",
    "womanfriend", "womenfriends",
  ]),
  ...words("good", [
    "feelgood", "goodafternoon", "goodevening", "gooder", "goodest", "goodie",
    "goodish", "goodun", "goody", "goodyear", "scattergood", "supergood",
  ]),
  ...words("him", ["himbo", "himboes"]),
  ...words("immediate", ["immediately", "immediateness"]),
  ...words("letter", [
    "bloodletter", "chainletter", "hateletter", "lettered", "letterer",
    "lettering", "letteropener", "loveletter", "newsletter", "reletter",
    "relettered", "relettering", "unlettered",
  ]),
  ...words("little", ["belittle", "belittled", "belittlement", "belittler"]),
  ...words("much", ["forasmuch", "inasmuch", "insomuch", "muchly", "muchness", "overmuch"]),
  ...words("must", [
    "musta", "mustard", "mustardy", "mustier", "mustiest", "mustily",
    "mustiness", "mustn't", "mustn't've", "must've", "musty",
  ]),
  ...words("necessary", ["unnecessary"]),
  ...words("paid", [
    "highlypaid", "illpaid", "lowlypaid", "overpaid", "poorlypaid",
    "postpaid", "prepaid", "repaid", "underpaid", "unpaid", "unrepaid",
    "wellpaid",
  ]),
  ...words("perceive", [
    "apperceive", "apperceived", "apperceiver", "misperceive", "misperceived",
    "misperceiver", "perceived", "perceiver", "unperceive", "unperceived",
  ]),
  ...words("perceiving", ["apperceiving", "misperceiving", "unperceiving"]),
  ...words("perhaps", ["perhapses"]),
  ...words("quick", [
    "doublequick", "quicken", "quickened", "quickener", "quickening", "quicker",
    "quickest", "quickie", "quickish", "quickishly", "quicky", "superquick",
    "unquick",
  ]),
  ...words("receive", [
    "preceive", "preceiver", "received", "receiver", "receivership",
    "unreceived",
  ]),
  ...words("receiving", ["preceiving"]),
  ...words("rejoice", [
    "rejoiced", "rejoiceful", "rejoicefully", "rejoicer", "rejoicefulness",
    "unrejoice", "unrejoiced", "unrejoiceful", "unrejoicefully", "unrejoicer",
    "unrejoicefulness",
  ]),
  ...words("rejoicing", ["rejoicingly", "unrejoicing", "unrejoicingly"]),
  ...words("said", [
    "aforesaid", "foresaid", "gainsaid", "missaid", "saidest", "saidst",
    "unsaid",
  ]),
  ...words("should", [
    "shoulda", "shouldest", "shouldn't", "shouldn't've", "shouldst", "should've",
  ]),
  ...words("such", ["nonesuch", "nonsuch", "somesuch", "suchlike"]),
  ...words("together", ["togetherness"]),
  ...words("would", [
    "'twould", "'twoulda", "'twouldn't", "'twouldn't've", "'twould've",
    "woulda", "wouldest", "wouldn't", "wouldn't've", "wouldst", "would've",
  ]),
  ...words("yourself", ["do-it-yourselfer"]),
];
