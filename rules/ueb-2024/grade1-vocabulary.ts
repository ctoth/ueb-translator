import definitions from "./grade1-vocabulary.json" with { type: "json" };
import { sourceData } from "./source-manifest.js";
import type { CompositionPolicies } from "../../src/composition.js";

export type ModeRuleName = keyof typeof definitions.modes;
export type ModeMemberClass = keyof typeof definitions.classes;
export type CompositionPolicyName = keyof CompositionPolicies;

export interface Grade1Vocabulary {
  readonly modes: Readonly<Record<ModeRuleName, number>>;
  readonly classes: Readonly<Record<ModeMemberClass, number>>;
  readonly policies: Readonly<Record<CompositionPolicyName, number>>;
}

/** Explicit IDs determine order, independently of JSON property insertion order. */
export function orderedNames<Key extends string>(
  ids: Readonly<Record<Key, number>>,
): readonly Key[] {
  return Object.keys(ids).filter((name): name is Key => Object.hasOwn(ids, name))
    .sort((left, right) => ids[left] - ids[right]);
}

function record(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIds<Key extends string>(
  value: unknown, declared: Readonly<Record<Key, number>>,
): Readonly<Record<Key, number>> {
  const valid = (candidate: unknown): candidate is Readonly<Record<Key, number>> =>
    record(candidate) && Object.keys(candidate).length === Object.keys(declared).length &&
    Object.keys(declared).every(name => typeof candidate[name] === "number" &&
      Number.isInteger(candidate[name]));
  if (!valid(value)) throw new Error("Expected a complete Grade 1 vocabulary.");
  if (orderedNames(value).some((name, index) => value[name] !== index)) {
    throw new Error("Grade 1 vocabulary IDs must be unique and dense from zero.");
  }
  return value;
}

export function readGrade1Vocabulary(value: unknown): Grade1Vocabulary {
  if (!record(value) || Object.keys(value).length !== 3) {
    throw new Error("Expected a Grade 1 vocabulary.");
  }
  return {
    modes: readIds(value["modes"], definitions.modes),
    classes: readIds(value["classes"], definitions.classes),
    policies: readIds(value["policies"], definitions.policies),
  };
}

export const GRADE1_VOCABULARY: Grade1Vocabulary = readGrade1Vocabulary(sourceData("vocabulary"));
export const MODE_NAMES: readonly ModeRuleName[] = orderedNames(GRADE1_VOCABULARY.modes);
export const MEMBER_CLASSES: readonly ModeMemberClass[] = orderedNames(GRADE1_VOCABULARY.classes);
export const POLICY_NAMES: readonly CompositionPolicyName[] = orderedNames(GRADE1_VOCABULARY.policies);
