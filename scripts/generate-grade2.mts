import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CompiledContextualMatcher } from "../rules/ueb-2024/contextual-compiler.js";
import type {
  CompactPrefixTable,
  ContextualBoundaryMask,
  ContextualGuardOpcode,
  ContextualGuardTuple,
  ContextualPrecedence,
  ContextualRuleTuple,
  ComposedContractionProgram,
} from "../src/contextual-transducer.js";

interface LoadedCompilation {
  readonly ids: readonly string[];
  readonly runtime: ComposedContractionProgram;
}

const repositoryRoot = resolve(import.meta.dirname, "..");
const compiledProgramPath = resolve(
  repositoryRoot,
  "node_modules",
  ".cache",
  "ueb-translator",
  "grade2-rules",
  "rules",
  "ueb-2024",
  "program.js",
);
const generatedProgramPath = resolve(
  repositoryRoot,
  "src",
  "generated",
  "ueb-2024",
  "grade2-program.ts",
);
const generatedProvenancePath = resolve(
  repositoryRoot,
  "src",
  "generated",
  "ueb-2024",
  "grade2-provenance.ts",
);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === "number" &&
    value >= minimum && value <= maximum;
}

function isContextualGuardOpcode(value: unknown): value is ContextualGuardOpcode {
  return isIntegerInRange(value, 0, 17);
}

function isNoOperandGuardOpcode(
  value: ContextualGuardOpcode,
): value is 1 | 3 | 8 | 9 | 10 | 12 | 13 | 14 | 15 | 16 {
  return value === 1 || value === 3 || value === 8 ||
    value === 9 || value === 10 || value === 12 || value === 13 ||
    value === 14 || value === 15 || value === 16;
}

function isStringOperandGuardOpcode(
  value: ContextualGuardOpcode,
): value is 2 | 7 | 11 | 17 {
  return value === 2 || value === 7 || value === 11 || value === 17;
}

function isTwoStringOperandGuardOpcode(
  value: ContextualGuardOpcode,
): value is 0 | 6 {
  return value === 0 || value === 6;
}

function isBoundaryOperandGuardOpcode(
  value: ContextualGuardOpcode,
): value is 4 | 5 {
  return value === 4 || value === 5;
}

function isContextualBoundaryMask(value: unknown): value is ContextualBoundaryMask {
  return isIntegerInRange(value, 1, 31);
}

function isContextualPrecedence(value: unknown): value is ContextualPrecedence {
  return isIntegerInRange(value, 0, 9);
}

function integerArray(value: unknown, name: string): readonly number[] {
  if (!Array.isArray(value)) {
    throw new Error(`Compiled Grade 2 ${name} is not an array.`);
  }
  return value.map((entry): number => {
    if (typeof entry !== "number" || !Number.isInteger(entry)) {
      throw new Error(`Compiled Grade 2 ${name} contains a non-integer.`);
    }
    return entry;
  });
}

function encodeCompactIntegers(
  values: readonly number[],
  name: string,
): string {
  let encoded = "";
  for (const value of values) {
    if (!isIntegerInRange(value, 0, 0xfeff)) {
      throw new Error(`Compiled Grade 2 ${name} exceeds fixed-width encoding.`);
    }
    encoded += String.fromCharCode(value + 0x100);
  }
  return encoded;
}

function compactMatcher(matcher: CompiledContextualMatcher): CompactPrefixTable {
  return [
    matcher.bucketAlphabet,
    matcher.inputs,
    encodeCompactIntegers(matcher.initialInputOffsets, "matcher initial input offsets"),
    encodeCompactIntegers(matcher.initialRuleOffsets, "matcher initial rule offsets"),
    encodeCompactIntegers(matcher.initialGuardOffsets, "matcher initial guard offsets"),
    encodeCompactIntegers(matcher.inputRuleCounts, "matcher input rule counts"),
    encodeCompactIntegers(matcher.inputGuardCounts, "matcher input guard counts"),
  ];
}

function loadCompilation(module: unknown): LoadedCompilation {
  const candidate = isRecord(module)
    ? module["GRADE2_CONTEXTUAL_COMPILATION"]
    : undefined;
  if (!isRecord(candidate) || !isRecord(candidate["runtime"])) {
    throw new Error("Compiled Grade 2 module has no contextual compilation.");
  }
  const runtime = candidate["runtime"];
  const rawRules = runtime["rules"];
  const rawGuards = runtime["guards"];
  const rawMatcher = runtime["matcher"];
  const rawOperands = runtime["stringOperands"];
  const rawProvenance = candidate["provenance"];
  const rawAmbiguities = isRecord(module)
    ? module["GRADE2_AMBIGUOUS_LETTER_SEQUENCES"]
    : undefined;
  const rawStandingLiteralInputs = isRecord(module)
    ? module["GRADE2_STANDING_LITERAL_INPUTS"]
    : undefined;
  if (
    !Array.isArray(rawRules) || !Array.isArray(rawGuards) ||
    !isRecord(rawMatcher) ||
    !Array.isArray(rawOperands) || !Array.isArray(rawProvenance) ||
    !Array.isArray(rawAmbiguities) || !Array.isArray(rawStandingLiteralInputs) ||
    !rawOperands.every((operand) => typeof operand === "string")
  ) {
    throw new Error("Compiled Grade 2 contextual program is malformed.");
  }

  const operands = rawOperands.map((operand): string => {
    if (typeof operand !== "string") {
      throw new Error("Compiled Grade 2 contextual program has a malformed operand.");
    }
    return operand;
  });
  const guards: ContextualGuardTuple[] = rawGuards.map(
    (guard): ContextualGuardTuple => {
      if (!Array.isArray(guard) || !isContextualGuardOpcode(guard[0])) {
        throw new Error("Compiled Grade 2 contextual program has a malformed guard.");
      }
      const opcode = guard[0];
      if (isNoOperandGuardOpcode(opcode) && guard.length === 1) {
        return [opcode];
      }
      if (
        isStringOperandGuardOpcode(opcode) && guard.length === 2 &&
        isIntegerInRange(guard[1], 0, operands.length - 1)
      ) {
        return [opcode, guard[1]];
      }
      if (
        isTwoStringOperandGuardOpcode(opcode) && guard.length === 3 &&
        isIntegerInRange(guard[1], 0, operands.length - 1) &&
        isIntegerInRange(guard[2], 0, operands.length - 1)
      ) {
        return [opcode, guard[1], guard[2]];
      }
      if (
        isBoundaryOperandGuardOpcode(opcode) && guard.length === 2 &&
        isContextualBoundaryMask(guard[1])
      ) {
        return [opcode, guard[1]];
      }
      throw new Error("Compiled Grade 2 contextual program has a malformed guard.");
    },
  );
  const rules: ContextualRuleTuple[] = rawRules.map((rule): ContextualRuleTuple => {
    if (
      !Array.isArray(rule) || rule.length !== 3 ||
      typeof rule[0] !== "string" || rule[0].length === 0 ||
      !isContextualPrecedence(rule[1]) ||
      !isIntegerInRange(rule[2], 0, guards.length)
    ) {
      throw new Error("Compiled Grade 2 contextual program has a malformed rule.");
    }
    return [rule[0], rule[1], rule[2]];
  });
  const rawInputs = rawMatcher["inputs"];
  const rawBucketAlphabet = rawMatcher["bucketAlphabet"];
  if (!Array.isArray(rawInputs) || !Array.isArray(rawBucketAlphabet)) {
    throw new Error("Compiled Grade 2 contextual matcher has no input table.");
  }
  const matcher: CompiledContextualMatcher = {
    bucketAlphabet: rawBucketAlphabet.map((initial): string => {
      if (typeof initial !== "string" || Array.from(initial).length !== 1) {
        throw new Error("Compiled Grade 2 contextual matcher has a malformed alphabet.");
      }
      return initial;
    }),
    initialGuardOffsets: integerArray(
      rawMatcher["initialGuardOffsets"],
      "matcher initial guard offsets",
    ),
    initialInputOffsets: integerArray(
      rawMatcher["initialInputOffsets"],
      "matcher initial input offsets",
    ),
    initialRuleOffsets: integerArray(
      rawMatcher["initialRuleOffsets"],
      "matcher initial rule offsets",
    ),
    inputs: rawInputs.map((input): string => {
      if (typeof input !== "string" || input.length === 0) {
        throw new Error("Compiled Grade 2 contextual matcher has a malformed input.");
      }
      return input;
    }),
    inputGuardCounts: integerArray(
      rawMatcher["inputGuardCounts"],
      "matcher input guard counts",
    ),
    inputRuleCounts: integerArray(
      rawMatcher["inputRuleCounts"],
      "matcher input rule counts",
    ),
  };
  if (
    matcher.bucketAlphabet.length === 0 ||
    new Set(matcher.bucketAlphabet).size !== matcher.bucketAlphabet.length ||
    matcher.initialInputOffsets.length !== matcher.bucketAlphabet.length + 1 ||
    matcher.initialRuleOffsets.length !== matcher.bucketAlphabet.length + 1 ||
    matcher.initialGuardOffsets.length !== matcher.bucketAlphabet.length + 1 ||
    matcher.initialInputOffsets[0] !== 0 ||
    matcher.initialInputOffsets.at(-1) !== matcher.inputs.length ||
    matcher.initialRuleOffsets[0] !== 0 ||
    matcher.initialRuleOffsets.at(-1) !== rules.length ||
    matcher.initialGuardOffsets[0] !== 0 ||
    matcher.initialGuardOffsets.at(-1) !== guards.length ||
    matcher.initialInputOffsets.some((offset, index, offsets) =>
      !isIntegerInRange(offset, 0, matcher.inputs.length) ||
      (index > 0 && offset < (offsets[index - 1] ?? 0))
    ) ||
    matcher.initialRuleOffsets.some((offset, index, offsets) =>
      !isIntegerInRange(offset, 0, rules.length) ||
      (index > 0 && offset < (offsets[index - 1] ?? 0))
    ) ||
    matcher.initialGuardOffsets.some((offset, index, offsets) =>
      !isIntegerInRange(offset, 0, guards.length) ||
      (index > 0 && offset < (offsets[index - 1] ?? 0))
    ) ||
    matcher.inputRuleCounts.length !== matcher.inputs.length ||
    matcher.inputRuleCounts.some((count) => !isIntegerInRange(count, 1, rules.length)) ||
    matcher.inputRuleCounts.reduce((total, count) => total + count, 0) !== rules.length ||
    matcher.inputGuardCounts.length !== matcher.inputs.length ||
    matcher.inputGuardCounts.some((count) => !isIntegerInRange(count, 0, guards.length)) ||
    matcher.inputGuardCounts.reduce((total, count) => total + count, 0) !== guards.length ||
    rules.reduce((total, rule) => total + rule[2], 0) !== guards.length ||
    matcher.inputs.some((input, index, inputs) =>
      index > 0 && input <= (inputs[index - 1] ?? "")
    ) ||
    matcher.inputs.some((input) =>
      !matcher.bucketAlphabet.includes(Array.from(input)[0] ?? "")
    )
  ) {
    throw new Error("Compiled Grade 2 contextual matcher is malformed.");
  }
  const ids = rawProvenance.map((source): string => {
    const id = isRecord(source) ? source["id"] : undefined;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error("Compiled Grade 2 contextual provenance is malformed.");
    }
    return id;
  });
  if (ids.length !== rules.length) {
    throw new Error("Compiled Grade 2 runtime and provenance are misaligned.");
  }
  const grade1Ambiguities = rawAmbiguities.map((entry): readonly [string, string] => {
    if (
      !Array.isArray(entry) || entry.length !== 2 ||
      typeof entry[0] !== "string" || !/^[a-z]+$/u.test(entry[0]) ||
      typeof entry[1] !== "string" || !/^[\u2800-\u28ff]+$/u.test(entry[1])
    ) {
      throw new Error("Compiled Grade 2 ambiguity table is malformed.");
    }
    return [entry[0], entry[1]];
  });
  const standingLiteralInputs = rawStandingLiteralInputs.map((input): string => {
    if (typeof input !== "string" || !/^[a-z]+$/u.test(input)) {
      throw new Error("Compiled Grade 2 standing-literal table is malformed.");
    }
    return input;
  });
  return {
    ids,
    runtime: {
      code: "ueb-2024",
      grade1Ambiguities,
      guards,
      matcher: compactMatcher(matcher),
      rules,
      standingLiteralInputs,
      stringOperands: operands,
    },
  };
}

function generatedProgram(program: ComposedContractionProgram): string {
  return `// Generated by scripts/generate-grade2.mts. Do not edit.\n` +
    `import type { ComposedContractionProgram } from "../../contextual-transducer.js";\n` +
    `export const GRADE2_PROGRAM: ComposedContractionProgram = ${JSON.stringify(program, undefined, 2)};\n`;
}

function generatedProvenance(ids: readonly string[]): string {
  return `// Generated by scripts/generate-grade2.mts. Do not edit.\n` +
    'export type Grade2RuleId = `UEB-10.${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}-${string}` | `UEB-Appendix-1-${string}-${string}`;\n' +
    `export const GRADE2_RULE_IDS: readonly Grade2RuleId[] = ${JSON.stringify(ids, undefined, 2)};\n`;
}

async function emit(path: string, content: string, check: boolean): Promise<void> {
  if (check) {
    const current = await readFile(path, "utf8");
    if (current !== content) {
      throw new Error(`${path} is not reproducible; run npm run grade2:generate.`);
    }
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

const imported: unknown = await import(
  `${pathToFileURL(compiledProgramPath).href}?generated=${String(Date.now())}`
);
const compilation = loadCompilation(imported);
const check = process.argv.includes("--check");
await emit(generatedProgramPath, generatedProgram(compilation.runtime), check);
await emit(generatedProvenancePath, generatedProvenance(compilation.ids), check);
