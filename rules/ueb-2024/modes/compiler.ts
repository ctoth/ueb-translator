import type {
  CompiledMode,
  CompiledModeIndicators,
  ModeClassMask,
  ModeProgram,
} from "../../../src/mode-engine.js";
import type { IcebRuleCitation } from "../source.js";
import { GRADE1_VOCABULARY, orderedNames, readGrade1Vocabulary,
  type Grade1Vocabulary, type ModeRuleName, type ModeMemberClass } from "../grade1-vocabulary.js";
export type { ModeRuleName, ModeMemberClass } from "../grade1-vocabulary.js";

export interface ModeIndicatorsSource {
  readonly passage: string;
  readonly symbol: string;
  readonly terminator: string;
  readonly word: string;
}

export interface ModeDefinitionSource {
  readonly continuesThrough: readonly ModeMemberClass[];
  readonly indicators: ModeIndicatorsSource;
  readonly memberClass: ModeMemberClass;
  readonly passageThreshold: number;
  readonly terminatedBy: readonly ModeMemberClass[];
}

export interface ModeRuleSource {
  readonly citation: IcebRuleCitation;
  readonly definition: ModeDefinitionSource;
  readonly id: string;
  readonly name: ModeRuleName;
}

export type ModeCompilationErrorCode =
  | "conflicting-mode" | "conflicting-rule-id" | "malformed-mode" | "uncited-rule";

export class ModeCompilationError extends Error {
  public readonly code: ModeCompilationErrorCode;
  public override readonly name = "ModeCompilationError";
  public readonly ruleIds: readonly string[];

  public constructor(code: ModeCompilationErrorCode, ruleIds: readonly string[], message: string) {
    super(message);
    this.code = code;
    this.ruleIds = ruleIds;
  }
}

export interface ModeCompilationResult {
  readonly classIds: ReadonlyMap<ModeMemberClass, number>;
  readonly modeIds: ReadonlyMap<ModeRuleName, number>;
  readonly provenance: readonly ModeRuleSource[];
  readonly runtime: ModeProgram;
}

function cited(rule: ModeRuleSource): boolean {
  return rule.citation.locator.trim().length > 0 &&
    rule.citation.authority === "ICEB";
}

function malformed(definition: ModeDefinitionSource): boolean {
  const indicators = definition.indicators;
  return !Number.isInteger(definition.passageThreshold) || definition.passageThreshold < 1 ||
    indicators.symbol.length === 0 || indicators.word.length === 0 ||
    indicators.passage.length === 0 ||
    definition.continuesThrough.includes(definition.memberClass) ||
    definition.terminatedBy.includes(definition.memberClass) ||
    definition.continuesThrough.some((modeClass) => definition.terminatedBy.includes(modeClass));
}

function classId(modeClass: ModeMemberClass, vocabulary: Grade1Vocabulary): number {
  return vocabulary.classes[modeClass];
}

function classMask(classes: readonly ModeMemberClass[], vocabulary: Grade1Vocabulary): ModeClassMask {
  let mask = 0;
  for (const modeClass of classes) mask |= 2 ** classId(modeClass, vocabulary);
  return mask;
}

function compiledMode(rule: ModeRuleSource, vocabulary: Grade1Vocabulary): CompiledMode {
  const indicators: CompiledModeIndicators = [
    rule.definition.indicators.symbol, rule.definition.indicators.word,
    rule.definition.indicators.passage, rule.definition.indicators.terminator,
  ];
  return [indicators, classId(rule.definition.memberClass, vocabulary), rule.definition.passageThreshold,
    classMask(rule.definition.terminatedBy, vocabulary), classMask(rule.definition.continuesThrough, vocabulary)];
}

function idMap<Value extends string>(values: readonly Value[]): ReadonlyMap<Value, number> {
  return new Map(values.map((value, index): readonly [Value, number] => [value, index]));
}

/** Compile fixed vocabulary into opaque IDs, masks, and tuples for the engine. */
export function compileModes(
  sourceRules: readonly ModeRuleSource[], vocabulary: Grade1Vocabulary = GRADE1_VOCABULARY,
): ModeCompilationResult {
  readGrade1Vocabulary(vocabulary);
  const modeNames = orderedNames(vocabulary.modes);
  const ids = new Set<string>();
  const byName = new Map<ModeRuleName, ModeRuleSource>();
  for (const rule of sourceRules) {
    if (ids.has(rule.id)) throw new ModeCompilationError("conflicting-rule-id", [rule.id, rule.id], `Mode rule id ${rule.id} is not unique.`);
    ids.add(rule.id);
    const prior = byName.get(rule.name);
    if (prior !== undefined) throw new ModeCompilationError("conflicting-mode", [prior.id, rule.id].sort(), `Mode ${rule.name} has multiple definitions.`);
    byName.set(rule.name, rule);
    if (!cited(rule)) throw new ModeCompilationError("uncited-rule", [rule.id], `Mode rule ${rule.id} lacks an official ICEB citation.`);
    if (malformed(rule.definition)) throw new ModeCompilationError("malformed-mode", [rule.id], `Mode rule ${rule.id} is not closed valid mode data.`);
  }
  const provenance: ModeRuleSource[] = [];
  const modes: CompiledMode[] = [];
  for (const name of modeNames) {
    const rule = byName.get(name);
    if (rule === undefined) throw new ModeCompilationError("malformed-mode", [], `Closed mode program is missing ${name}.`);
    provenance.push(rule);
    modes.push(compiledMode(rule, vocabulary));
  }
  return { classIds: idMap(orderedNames(vocabulary.classes)), modeIds: idMap(modeNames), provenance, runtime: { modes } };
}
