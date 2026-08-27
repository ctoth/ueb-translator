import type { CompositionPolicies } from "../../../src/composition.js";
import type { IcebRuleCitation } from "../source.js";

export type CompositionPolicyName = keyof CompositionPolicies;

export interface CompositionPolicySource {
  readonly citation: IcebRuleCitation;
  readonly id: string;
  readonly members: readonly string[];
  readonly name: CompositionPolicyName;
}

export interface CompositionPolicyCompilation {
  readonly provenance: readonly CompositionPolicySource[];
  readonly runtime: CompositionPolicies;
}

const POLICY_NAMES = [
  "closingStandingPunctuation",
  "lowerPunctuation",
  "openingStandingPunctuation",
  "standingBoundaries",
] as const satisfies readonly CompositionPolicyName[];

export function compileCompositionPolicies(
  rules: readonly CompositionPolicySource[],
): CompositionPolicyCompilation {
  const ids = new Set<string>();
  const byName = new Map<CompositionPolicyName, CompositionPolicySource>();
  for (const rule of rules) {
    if (
      ids.has(rule.id) || byName.has(rule.name) || rule.members.length === 0 ||
      new Set(rule.members).size !== rule.members.length ||
      rule.members.some((member) => Array.from(member).length !== 1) ||
      !rule.citation.url.startsWith("https://iceb.org/")
    ) {
      throw new Error(`Composition policy ${rule.id} is not closed cited data.`);
    }
    ids.add(rule.id);
    byName.set(rule.name, rule);
  }
  const provenance = POLICY_NAMES.map((name) => {
    const rule = byName.get(name);
    if (rule === undefined) throw new Error(`Composition policy ${name} is missing.`);
    return rule;
  });
  const [closing, lower, opening, standing] = provenance;
  /* v8 ignore next -- POLICY_NAMES fixes the four-element result above. */
  if (closing === undefined || lower === undefined || opening === undefined || standing === undefined) {
    throw new Error("Composition policy compilation is incomplete.");
  }
  return {
    provenance,
    runtime: {
      closingStandingPunctuation: closing.members.join(""),
      lowerPunctuation: lower.members.join(""),
      openingStandingPunctuation: opening.members.join(""),
      standingBoundaries: standing.members.join(""),
    },
  };
}
