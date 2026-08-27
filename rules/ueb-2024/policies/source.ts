import { citeIceb } from "../source.js";
import type { CompositionPolicySource } from "./compiler.js";

export const COMPOSITION_POLICY_RULES: readonly CompositionPolicySource[] = [
  {
    citation: citeIceb("2.6"),
    id: "UEB-policy-dash-joiners",
    members: Array.from("–—-"),
    name: "dashJoiners",
  },
  {
    citation: citeIceb("2.6"),
    id: "UEB-policy-elision-punctuation",
    members: Array.from("'’"),
    name: "elisionPunctuation",
  },
  {
    citation: citeIceb("2.6"),
    id: "UEB-policy-closing-standing-punctuation",
    members: Array.from(",;:.…!?)]}”’\"'»"),
    name: "closingStandingPunctuation",
  },
  {
    citation: citeIceb("10.5"),
    id: "UEB-policy-lower-punctuation",
    members: Array.from(",;:.…?\"'“”‘’–—-"),
    name: "lowerPunctuation",
  },
  {
    citation: citeIceb("2.6"),
    id: "UEB-policy-opening-standing-punctuation",
    members: Array.from("([{“‘\"'«"),
    name: "openingStandingPunctuation",
  },
  {
    citation: citeIceb("2.6"),
    id: "UEB-policy-standing-boundaries",
    members: [" ", "\n", "\r", "–", "—", "-"],
    name: "standingBoundaries",
  },
];
