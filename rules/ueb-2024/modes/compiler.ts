import type {
  CompiledMode,
  CompiledModeIndicators,
  ModeClassMask,
  ModeProgram,
} from "../../../src/mode-engine.js";
import type { IcebRuleCitation } from "../source.js";

export type ModeRuleName =
  | "capitals" | "grade1" | "numeric"
  | "typeform-bold" | "typeform-italic" | "typeform-script"
  | "typeform-transcriber-defined" | "typeform-underline";

export type ModeMemberClass =
  | "capitals-continuation" | "digit" | "grade1-required" | "lowercase-letter"
  | "numeric-ambiguous-letter" | "numeric-punctuation"
  | "sequence-boundary" | "typeformed" | "uppercase-letter";

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

const MODE_NAMES: readonly ModeRuleName[] = [
  "capitals", "grade1", "numeric", "typeform-bold", "typeform-italic",
  "typeform-script", "typeform-transcriber-defined", "typeform-underline",
];

const MEMBER_CLASSES: readonly ModeMemberClass[] = [
  "digit", "grade1-required", "lowercase-letter", "numeric-ambiguous-letter",
  "numeric-punctuation", "sequence-boundary", "typeformed", "uppercase-letter",
  "capitals-continuation",
];

const MEMBER_CLASS_IDS = {
  digit: 0,
  "grade1-required": 1,
  "lowercase-letter": 2,
  "numeric-ambiguous-letter": 3,
  "numeric-punctuation": 4,
  "sequence-boundary": 5,
  typeformed: 6,
  "uppercase-letter": 7,
  "capitals-continuation": 8,
} satisfies Readonly<Record<ModeMemberClass, number>>;

function cited(rule: ModeRuleSource): boolean {
  return rule.citation.locator.trim().length > 0 &&
    rule.citation.url.startsWith("https://iceb.org/");
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

function classId(modeClass: ModeMemberClass): number {
  return MEMBER_CLASS_IDS[modeClass];
}

function classMask(classes: readonly ModeMemberClass[]): ModeClassMask {
  let mask = 0;
  for (const modeClass of classes) mask |= 2 ** classId(modeClass);
  return mask;
}

function compiledMode(rule: ModeRuleSource): CompiledMode {
  const indicators: CompiledModeIndicators = [
    rule.definition.indicators.symbol, rule.definition.indicators.word,
    rule.definition.indicators.passage, rule.definition.indicators.terminator,
  ];
  return [indicators, classId(rule.definition.memberClass), rule.definition.passageThreshold,
    classMask(rule.definition.terminatedBy), classMask(rule.definition.continuesThrough)];
}

function idMap<Value extends string>(values: readonly Value[]): ReadonlyMap<Value, number> {
  return new Map(values.map((value, index): readonly [Value, number] => [value, index]));
}

/** Compile fixed vocabulary into opaque IDs, masks, and tuples for the engine. */
export function compileModes(sourceRules: readonly ModeRuleSource[]): ModeCompilationResult {
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
  for (const name of MODE_NAMES) {
    const rule = byName.get(name);
    if (rule === undefined) throw new ModeCompilationError("malformed-mode", [], `Closed mode program is missing ${name}.`);
    provenance.push(rule);
    modes.push(compiledMode(rule));
  }
  return { classIds: idMap(MEMBER_CLASSES), modeIds: idMap(MODE_NAMES), provenance, runtime: { modes } };
}
