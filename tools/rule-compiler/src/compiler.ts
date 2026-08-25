import type { CompiledTransducer } from "../../../src/transducer.js";

/** A pinpoint citation into an official Braille authority publication. */
export interface RuleCitation {
  readonly authority: "BANA" | "ICEB";
  readonly document: string;
  readonly locator: string;
  readonly url: string;
}

/** Readable, reviewable source form for one exact input-to-output rule. */
export interface RuleDefinition {
  readonly citation: RuleCitation;
  readonly id: string;
  readonly input: string;
  readonly output: string;
}

export type RuleCompilationErrorCode =
  | "ambiguous-input"
  | "conflicting-rule-id"
  | "uncited-rule"
  | "unreachable-rule";

export class RuleCompilationError extends Error {
  public readonly code: RuleCompilationErrorCode;
  public override readonly name = "RuleCompilationError";
  public readonly ruleIds: readonly string[];

  public constructor(
    code: RuleCompilationErrorCode,
    ruleIds: readonly string[],
    message: string,
  ) {
    super(message);
    this.code = code;
    this.ruleIds = ruleIds;
  }
}

export interface CompilationProvenance {
  readonly outputRuleIds: readonly (readonly string[])[];
  readonly rules: readonly RuleDefinition[];
  readonly stateRuleIds: readonly (readonly string[])[];
}

export interface CompilationResult {
  readonly provenance: CompilationProvenance;
  readonly runtime: CompiledTransducer;
}

interface MutableState {
  readonly edges: Map<number, MutableState>;
  outputIndex: number;
}

interface FlatGraph {
  readonly runtime: CompiledTransducer;
  readonly stateIndexes: ReadonlyMap<MutableState, number>;
}

const NO_OUTPUT = -1;
const OFFICIAL_ORIGINS: Readonly<Record<RuleCitation["authority"], ReadonlySet<string>>> = {
  BANA: new Set(["https://brailleauthority.org", "https://www.brailleauthority.org"]),
  ICEB: new Set(["https://iceb.org", "https://www.iceb.org"]),
};

function newState(): MutableState {
  return { edges: new Map(), outputIndex: NO_OUTPUT };
}

function compareCodePoints(left: readonly number[], right: readonly number[]): number {
  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    /* v8 ignore next -- index is bounded by both array lengths. */
    if (leftValue === undefined || rightValue === undefined) {
      break;
    }
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }
  return left.length - right.length;
}

function inputCodePoints(input: string): number[] {
  const result: number[] = [];
  for (const scalar of input) {
    const first = scalar.charCodeAt(0);
    const codePoint =
      scalar.length === 1
        ? first
        : ((first - 0xd800) << 10) + scalar.charCodeAt(1) - 0xdc00 + 0x10000;
    result.push(codePoint);
  }
  return result;
}

function cloneRule(rule: RuleDefinition): RuleDefinition {
  return {
    citation: {
      authority: rule.citation.authority,
      document: rule.citation.document,
      locator: rule.citation.locator,
      url: rule.citation.url,
    },
    id: rule.id,
    input: rule.input,
    output: rule.output,
  };
}

function isOfficialCitation(citation: RuleCitation): boolean {
  if (
    citation.document.trim().length === 0 ||
    citation.locator.trim().length === 0
  ) {
    return false;
  }

  try {
    const url = new URL(citation.url);
    return OFFICIAL_ORIGINS[citation.authority].has(url.origin);
  } catch {
    return false;
  }
}

function validateAndSort(rules: readonly RuleDefinition[]): RuleDefinition[] {
  const ids = new Map<string, RuleDefinition>();
  const inputs = new Map<string, RuleDefinition>();
  const copies: RuleDefinition[] = [];

  if (rules.length === 0) {
    throw new RuleCompilationError(
      "unreachable-rule",
      [],
      "At least one reachable rule is required.",
    );
  }

  for (const sourceRule of rules) {
    const rule = cloneRule(sourceRule);
    if (rule.input.length === 0) {
      throw new RuleCompilationError(
        "unreachable-rule",
        [rule.id],
        `Rule ${rule.id} has an empty input.`,
      );
    }
    if (!isOfficialCitation(rule.citation)) {
      throw new RuleCompilationError(
        "uncited-rule",
        [rule.id],
        `Rule ${rule.id} lacks a pinpoint citation to its named official authority.`,
      );
    }

    const previousId = ids.get(rule.id);
    if (previousId !== undefined) {
      throw new RuleCompilationError(
        "conflicting-rule-id",
        [previousId.id, rule.id],
        `Rule id ${rule.id} is not unique.`,
      );
    }
    ids.set(rule.id, rule);

    const previousInput = inputs.get(rule.input);
    if (previousInput !== undefined) {
      throw new RuleCompilationError(
        "ambiguous-input",
        [previousInput.id, rule.id],
        `Input ${JSON.stringify(rule.input)} has more than one rule.`,
      );
    }
    inputs.set(rule.input, rule);
    copies.push(rule);
  }

  copies.sort((left, right) => {
    const byInput = compareCodePoints(
      inputCodePoints(left.input),
      inputCodePoints(right.input),
    );
    return byInput;
  });
  return copies;
}

function commonPrefixLength(
  left: readonly number[],
  right: readonly number[],
): number {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

function stateSignature(
  state: MutableState,
  canonicalIds: ReadonlyMap<MutableState, number>,
): string {
  const parts = [String(state.outputIndex)];
  const edges = [...state.edges.entries()].sort(
    ([left], [right]) => left - right,
  );
  for (const [label, target] of edges) {
    const targetId = canonicalIds.get(target);
    /* v8 ignore next -- suffix children are registered before their parent. */
    if (targetId === undefined) {
      throw new Error("Compiler invariant failed: child state is not canonical.");
    }
    parts.push(`${String(label)}:${String(targetId)}`);
  }
  return parts.join("|");
}

function buildMinimalGraph(
  rules: readonly RuleDefinition[],
  outputIndexes: ReadonlyMap<string, number>,
): MutableState {
  const root = newState();
  const register = new Map<string, MutableState>();
  const canonicalIds = new Map<MutableState, number>();
  let nextCanonicalId = 0;
  let previousWord: readonly number[] = [];
  const path: MutableState[] = [root];

  function canonicalize(state: MutableState): MutableState {
    const signature = stateSignature(state, canonicalIds);
    const existing = register.get(signature);
    if (existing !== undefined) {
      return existing;
    }
    register.set(signature, state);
    canonicalIds.set(state, nextCanonicalId);
    nextCanonicalId += 1;
    return state;
  }

  function minimizeSuffix(prefixLength: number): void {
    for (let depth = previousWord.length; depth > prefixLength; depth -= 1) {
      const parent = path[depth - 1];
      const child = path[depth];
      const label = previousWord[depth - 1];
      /* v8 ignore next -- path and word are constructed together. */
      if (parent === undefined || child === undefined || label === undefined) {
        throw new Error("Compiler invariant failed: incomplete mutable path.");
      }
      parent.edges.set(label, canonicalize(child));
    }
    path.length = prefixLength + 1;
  }

  for (const rule of rules) {
    const word = inputCodePoints(rule.input);
    const prefixLength = commonPrefixLength(previousWord, word);
    minimizeSuffix(prefixLength);
    const prefixState = path[prefixLength];
    /* v8 ignore next -- the common prefix always remains on the mutable path. */
    if (prefixState === undefined) {
      throw new Error("Compiler invariant failed: missing common-prefix state.");
    }

    let current = prefixState;
    for (let index = prefixLength; index < word.length; index += 1) {
      const label = word[index];
      /* v8 ignore next -- index is bounded by word.length. */
      if (label === undefined) {
        throw new Error("Compiler invariant failed: missing input label.");
      }
      const child = newState();
      current.edges.set(label, child);
      path.push(child);
      current = child;
    }

    const outputIndex = outputIndexes.get(rule.output);
    /* v8 ignore next -- outputIndexes is built from the same validated rules. */
    if (outputIndex === undefined) {
      throw new Error("Compiler invariant failed: missing output index.");
    }
    current.outputIndex = outputIndex;
    previousWord = word;
  }

  minimizeSuffix(0);
  return root;
}

function flattenGraph(root: MutableState, outputs: readonly string[]): FlatGraph {
  const stateIndexes = new Map<MutableState, number>([[root, 0]]);
  const queue: MutableState[] = [root];
  const stateEdgeOffsets: number[] = [];
  const edgeLabels: number[] = [];
  const edgeTargets: number[] = [];
  const stateOutputIndexes: number[] = [];

  let stateIndex = 0;
  while (stateIndex < queue.length) {
    const state = queue[stateIndex];
    /* v8 ignore next -- stateIndex is bounded by queue.length. */
    if (state === undefined) {
      throw new Error("Compiler invariant failed: missing queued state.");
    }
    stateEdgeOffsets.push(edgeLabels.length);
    stateOutputIndexes.push(state.outputIndex);

    const edges = [...state.edges.entries()].sort(
      ([left], [right]) => left - right,
    );
    for (const [label, target] of edges) {
      let targetIndex = stateIndexes.get(target);
      if (targetIndex === undefined) {
        targetIndex = queue.length;
        stateIndexes.set(target, targetIndex);
        queue.push(target);
      }
      edgeLabels.push(label);
      edgeTargets.push(targetIndex);
    }
    stateIndex += 1;
  }
  stateEdgeOffsets.push(edgeLabels.length);

  return {
    runtime: {
      edgeLabels,
      edgeTargets,
      outputs,
      stateEdgeOffsets,
      stateOutputIndexes,
    },
    stateIndexes,
  };
}

function buildProvenance(
  rules: readonly RuleDefinition[],
  root: MutableState,
  flatGraph: FlatGraph,
): CompilationProvenance {
  const stateRuleIds = Array.from(
    { length: flatGraph.runtime.stateOutputIndexes.length },
    (): string[] => [],
  );
  const outputRuleIds = Array.from(
    { length: flatGraph.runtime.outputs.length },
    (): string[] => [],
  );

  for (const rule of rules) {
    let state = root;
    const rootIndex = flatGraph.stateIndexes.get(root);
    /* v8 ignore next -- flattenGraph always indexes its root. */
    if (rootIndex === undefined) {
      throw new Error("Compiler invariant failed: root was not flattened.");
    }
    const rootRules = stateRuleIds[rootIndex];
    /* v8 ignore next -- provenance arrays match the flattened state count. */
    if (rootRules === undefined) {
      throw new Error("Compiler invariant failed: missing root provenance.");
    }
    rootRules.push(rule.id);

    for (const label of inputCodePoints(rule.input)) {
      const target = state.edges.get(label);
      /* v8 ignore next -- buildMinimalGraph inserted every validated rule. */
      if (target === undefined) {
        throw new Error("Compiler invariant failed: rule path is missing.");
      }
      state = target;
      const stateIndex = flatGraph.stateIndexes.get(state);
      /* v8 ignore next -- flattenGraph visits every reachable rule state. */
      if (stateIndex === undefined) {
        throw new Error("Compiler invariant failed: rule state was not flattened.");
      }
      const stateRules = stateRuleIds[stateIndex];
      /* v8 ignore next -- provenance arrays match the flattened state count. */
      if (stateRules === undefined) {
        throw new Error("Compiler invariant failed: missing state provenance.");
      }
      stateRules.push(rule.id);
    }

    /* v8 ignore next -- every validated rule terminates at its assigned output. */
    if (state.outputIndex < 0) {
      throw new Error("Compiler invariant failed: rule path is not final.");
    }
    const outputRules = outputRuleIds[state.outputIndex];
    /* v8 ignore next -- output provenance matches the compiler output pool. */
    if (outputRules === undefined) {
      throw new Error("Compiler invariant failed: missing output provenance.");
    }
    outputRules.push(rule.id);
  }

  return { outputRuleIds, rules, stateRuleIds };
}

/**
 * Compile cited rules using the sorted incremental minimal acyclic construction
 * of Daciuk et al. (2000), section 3. Outputs extend terminal-state identity as
 * described in section 4.1.
 * https://aclanthology.org/J00-1002/
 */
export function compileRules(rules: readonly RuleDefinition[]): CompilationResult {
  const sortedRules = validateAndSort(rules);
  const outputs: string[] = [];
  const outputIndexes = new Map<string, number>();
  for (const rule of sortedRules) {
    if (!outputIndexes.has(rule.output)) {
      outputIndexes.set(rule.output, outputs.length);
      outputs.push(rule.output);
    }
  }

  const root = buildMinimalGraph(sortedRules, outputIndexes);
  const flatGraph = flattenGraph(root, outputs);
  return {
    provenance: buildProvenance(sortedRules, root, flatGraph),
    runtime: flatGraph.runtime,
  };
}
