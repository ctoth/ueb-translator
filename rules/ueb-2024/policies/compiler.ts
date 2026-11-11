import type { CompositionPolicies } from "../../../src/composition.js";
import type { IcebRuleCitation } from "../source.js";
import { GRADE1_VOCABULARY, isCompositionPolicies, orderedNames, readGrade1Vocabulary,
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
      rule.citation.authority !== "ICEB"
    ) {
      throw new Error(`Composition policy ${rule.id} is not closed cited data.`);
    }
    ids.add(rule.id);
    byName.set(rule.name, rule);
  }
  const provenance = orderedNames(vocabulary.policies).flatMap((name) => byName.get(name) ?? []);
  const runtime = Object.fromEntries(provenance.map((rule) => [rule.name, rule.members.join("")]));
  if (!isCompositionPolicies(runtime)) throw new Error("A composition policy is missing.");
  return { provenance, runtime };
}
