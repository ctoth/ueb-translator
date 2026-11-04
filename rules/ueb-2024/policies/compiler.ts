import type { CompositionPolicies } from "../../../src/composition.js";
import type { IcebRuleCitation } from "../source.js";
import { GRADE1_VOCABULARY, orderedNames, readGrade1Vocabulary,
  type Grade1Vocabulary, type CompositionPolicyName } from "../grade1-vocabulary.js";
export type { CompositionPolicyName } from "../grade1-vocabulary.js";


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

export function compileCompositionPolicies(
  rules: readonly CompositionPolicySource[], vocabulary: Grade1Vocabulary = GRADE1_VOCABULARY,
): CompositionPolicyCompilation {
  readGrade1Vocabulary(vocabulary);
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
  const provenance = orderedNames(vocabulary.policies).map((name) => {
    const rule = byName.get(name);
    if (rule === undefined) throw new Error(`Composition policy ${name} is missing.`);
    return rule;
  });
  const compiled = (name: CompositionPolicyName): string => {
    const rule = byName.get(name);
    /* v8 ignore next -- the complete-name check above established every entry. */
    if (rule === undefined) throw new Error(`Composition policy ${name} is missing.`);
    return rule.members.join("");
  };
  return {
    provenance,
    runtime: {
      closingStandingPunctuation: compiled("closingStandingPunctuation"),
      dashJoiners: compiled("dashJoiners"),
      elisionPunctuation: compiled("elisionPunctuation"),
      lowerPunctuation: compiled("lowerPunctuation"),
      openingStandingPunctuation: compiled("openingStandingPunctuation"),
      standingBoundaries: compiled("standingBoundaries"),
    },
  };
}
