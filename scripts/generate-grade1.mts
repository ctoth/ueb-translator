import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { ModeProgram } from "../src/mode-engine.js";
import type { CompiledSymbol, SymbolProgram } from "../src/symbol-program.js";
import type { CompositionPolicies } from "../src/composition.js";
import {
  TECHNICAL_ARROW_DIRECTIONS, TECHNICAL_COMPARISONS, TECHNICAL_MODIFIERS, TECHNICAL_OPERATIONS, TECHNICAL_SCRIPT_PLACEMENTS,
  TECHNICAL_SHAPE_FILLS, TECHNICAL_SHAPE_NAMES, type TechnicalSignProgram,
  TECHNICAL_VALUE_KINDS, TECHNICAL_ITEM_KINDS, TECHNICAL_DELIMITER_SIGNS, TECHNICAL_ENCLOSURES, TECHNICAL_MATRIX_ENCLOSURES,
  isTechnicalLayouts,
} from "../src/technical-program.ts";

interface LoadedCompilation {
  readonly facts: Readonly<Record<string, unknown>>;
  readonly initialElisionWords: readonly string[];
  readonly classIds: Readonly<Record<string, number>>;
  readonly modeIds: Readonly<Record<string, number>>;
  readonly modeRuleIds: readonly string[];
  readonly modes: ModeProgram;
  readonly policies: CompositionPolicies;
  readonly policyRuleIds: readonly string[];
  readonly symbolRuleIds: readonly string[];
  readonly symbols: SymbolProgram;
  readonly technical: TechnicalSignProgram;
}

const repositoryRoot = resolve(import.meta.dirname, "..");
const compiledProgramPath = resolve(
  repositoryRoot,
  "node_modules", ".cache", "ueb-translator", "grade2-rules",
  "rules", "ueb-2024", "grade1-program.js",
);
const generatedProgramPath = resolve(
  repositoryRoot, "src", "generated", "ueb-2024", "grade1-program.ts",
);
const generatedProvenancePath = resolve(
  repositoryRoot,
  "src", "generated", "ueb-2024", "grade1-provenance.ts",
);
const generatedTechnicalPath = resolve(
  repositoryRoot, "src", "generated", "ueb-2024", "technical-program.ts",
);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function isCompiledSymbol(value: unknown): value is CompiledSymbol {
  return isRecord(value) && typeof value["braille"] === "string" &&
    (value["kind"] === "digit" || value["kind"] === "letter" || value["kind"] === "modifier" ||
      value["kind"] === "symbol") &&
    (typeof value["numericDigit"] === "string" || value["numericDigit"] === null) &&
    typeof value["print"] === "string" &&
    (typeof value["uppercasePrint"] === "string" || value["uppercasePrint"] === null);
}

function symbolProgram(value: unknown): SymbolProgram {
  const symbols = isRecord(value) ? value["symbols"] : undefined;
  if (!Array.isArray(symbols) || !symbols.every(isCompiledSymbol)) {
    throw new Error("Compiled Grade 1 symbol program is malformed.");
  }
  return { symbols };
}

function isPrintMap<Key extends string>(
  value: unknown, keys: readonly Key[],
): value is Readonly<Record<Key, string>> {
  return isRecord(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => typeof value[key] === "string");
}

function isBooleanMap<Key extends string>(
  value: unknown, keys: readonly Key[],
): value is Readonly<Record<Key, boolean>> {
  return isRecord(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => typeof value[key] === "boolean");
}

function technicalProgram(value: unknown): TechnicalSignProgram {
  const arrows = isRecord(value) ? value["arrows"] : undefined;
  const operations = isRecord(value) ? value["operations"] : undefined;
  const comparisons = isRecord(value) ? value["comparisons"] : undefined;
  const scripts = isRecord(value) ? value["scripts"] : undefined;
  const delimiters = isRecord(value) ? value["delimiters"] : undefined;
  const itemPolicy = isRecord(value) ? value["itemPolicy"] : undefined;
  const operationSpacing = isRecord(value) ? value["operationSpacing"] : undefined;
  const valuePatterns = isRecord(value) ? value["valuePatterns"] : undefined;
  const computerWhitespace = isRecord(value) ? value["computerWhitespace"] : undefined;
  const numericContinuation = isRecord(value) ? value["numericContinuation"] : undefined;
  const functionSpacing = isRecord(value) ? value["functionSpacing"] : undefined;
  const grade1Protection = isRecord(value) ? value["grade1Protection"] : undefined;
  const modifiers = isRecord(value) ? value["modifiers"] : undefined;
  const shapes = isRecord(value) ? value["shapes"] : undefined;
  const layouts = isRecord(value) ? value["layouts"] : undefined;
  if (!isTechnicalLayouts(layouts) || !isPrintMap(arrows, TECHNICAL_ARROW_DIRECTIONS) ||
    !isPrintMap(operations, TECHNICAL_OPERATIONS) ||
    !isPrintMap(comparisons, TECHNICAL_COMPARISONS) || !isScriptMap(scripts) ||
    !isPrintMap(modifiers, TECHNICAL_MODIFIERS) || !isShapeMap(shapes) || !isDelimiterMap(delimiters) ||
    !isItemPolicy(itemPolicy) || !isPrintMap(valuePatterns, TECHNICAL_VALUE_KINDS) ||
    !isOperationSpacing(operationSpacing) || !isGrade1Protection(grade1Protection) || !isFunctionSpacing(functionSpacing) || !isNumericContinuation(numericContinuation) || !isComputerWhitespace(computerWhitespace)) {
    throw new Error("Compiled technical sign mappings are malformed.");
  }
  return { ...symbolProgram(value), layouts, arrows, operations, comparisons, scripts, modifiers, shapes, delimiters, itemPolicy, valuePatterns, operationSpacing, grade1Protection, functionSpacing, numericContinuation, computerWhitespace };
}

function isGrade1Protection(value: unknown): value is TechnicalSignProgram["grade1Protection"] {
  if (!isRecord(value)) return false;
  const rules = value["standingValues"];
  const maxSymbols = value["maxSymbolsPerSequence"];
  const passageThreshold = value["passageSequenceThreshold"];
  return typeof maxSymbols === "number" && Number.isSafeInteger(maxSymbols) && maxSymbols > 0 &&
    typeof passageThreshold === "number" && Number.isSafeInteger(passageThreshold) && passageThreshold > 0 &&
    Array.isArray(rules) && rules.length > 0 && rules.every((rule: unknown) =>
      isRecord(rule) && typeof rule["pattern"] === "string" && rule["pattern"].length > 0 &&
      (rule["flags"] === "iu" || rule["flags"] === "u") &&
      (rule["kind"] === "standing-symbol" || rule["kind"] === "standing-word"));
}

function isFunctionSpacing(value: unknown): value is TechnicalSignProgram["functionSpacing"] {
  return isRecord(value) && Array.isArray(value["letterCells"]) &&
    value["letterCells"].every((cell: unknown) => typeof cell === "string") &&
    typeof value["namePattern"] === "string";
}

function isNumericContinuation(value: unknown): value is TechnicalSignProgram["numericContinuation"] {
  if (!isRecord(value)) return false;
  const kinds = value["precedingKinds"];
  const expressionKinds: readonly string[] = [...TECHNICAL_ITEM_KINDS, "identifier"];
  return Array.isArray(kinds) && kinds.every((kind: unknown) =>
    typeof kind === "string" && expressionKinds.includes(kind)) &&
    typeof value["identifierPattern"] === "string";
}

function isComputerWhitespace(value: unknown): value is TechnicalSignProgram["computerWhitespace"] {
  return isRecord(value) && typeof value["visibleSpace"] === "string" &&
    typeof value["minimumRunLength"] === "number" && typeof value["ordinaryEdgeLength"] === "number";
}

function isOperationSpacing(value: unknown): value is TechnicalSignProgram["operationSpacing"] {
  return isRecord(value) &&
    isBooleanMap(value["international"], ["spaced", "unspaced"]) &&
    isBooleanMap(value["bana-2026"], ["standardized", "teaching"]);
}

function isItemPolicy(value: unknown): value is TechnicalSignProgram["itemPolicy"] {
  if (!isRecord(value)) return false;
  const kinds = value["kinds"];
  return isBooleanMap(kinds, TECHNICAL_ITEM_KINDS) &&
    typeof value["identifierPattern"] === "string";
}

function isDelimiterMap(value: unknown): value is TechnicalSignProgram["delimiters"] {
  if (!isRecord(value)) return false;
  const { enclosures, matrixEnclosures, ...signs } = value;
  const pairs = (mapping: unknown, keys: readonly string[]): boolean =>
    isRecord(mapping) && Object.keys(mapping).length === keys.length && keys.every((key) => {
      const pair = mapping[key];
      return isPrintMap(pair, ["open", "close"]);
    });
  return isPrintMap(signs, TECHNICAL_DELIMITER_SIGNS) &&
    pairs(enclosures, TECHNICAL_ENCLOSURES) && pairs(matrixEnclosures, TECHNICAL_MATRIX_ENCLOSURES);
}

function isShapeMap(value: unknown): value is TechnicalSignProgram["shapes"] {
  return isRecord(value) &&
    isPrintMap(value["fills"], TECHNICAL_SHAPE_FILLS) &&
    isPrintMap(value["names"], TECHNICAL_SHAPE_NAMES) &&
    typeof value["terminator"] === "string";
}

function isScriptMap(value: unknown): value is TechnicalSignProgram["scripts"] {
  return isRecord(value) && Object.keys(value).length === TECHNICAL_SCRIPT_PLACEMENTS.length &&
    TECHNICAL_SCRIPT_PLACEMENTS.every((placement) => {
      const rule = value[placement];
      return isRecord(rule) && typeof rule["indicator"] === "string" &&
        (rule["position"] === "before" || rule["position"] === "after");
    });
}

function modeProgram(value: unknown): ModeProgram {
  const modes = isRecord(value) ? value["modes"] : undefined;
  if (!Array.isArray(modes) || !modes.every((mode) =>
    Array.isArray(mode) && mode.length === 5 && Array.isArray(mode[0]) &&
    mode[0].length === 4 && mode[0].every((indicator) => typeof indicator === "string") &&
    mode.slice(1).every((operand) => typeof operand === "number" && Number.isInteger(operand))
  )) {
    throw new Error("Compiled Grade 1 mode program is malformed.");
  }
  return { modes };
}

function compositionPolicies(value: unknown): CompositionPolicies {
  if (!isRecord(value)) {
    throw new Error("Compiled composition policies are malformed.");
  }
  const closingStandingPunctuation = value["closingStandingPunctuation"];
  const dashJoiners = value["dashJoiners"];
  const elisionPunctuation = value["elisionPunctuation"];
  const lowerPunctuation = value["lowerPunctuation"];
  const openingStandingPunctuation = value["openingStandingPunctuation"];
  const standingBoundaries = value["standingBoundaries"];
  const standingSuffixes = value["standingSuffixes"];
  if (
    typeof closingStandingPunctuation !== "string" ||
    typeof dashJoiners !== "string" ||
    typeof elisionPunctuation !== "string" ||
    typeof lowerPunctuation !== "string" ||
    typeof openingStandingPunctuation !== "string" ||
    typeof standingBoundaries !== "string" ||
    typeof standingSuffixes !== "string"
  ) {
    throw new Error("Compiled composition policies are malformed.");
  }
  return {
    closingStandingPunctuation,
    dashJoiners,
    elisionPunctuation,
    lowerPunctuation,
    openingStandingPunctuation,
    standingBoundaries,
    standingSuffixes,
  };
}

function idObject(value: unknown, label: string): Readonly<Record<string, number>> {
  if (!(value instanceof Map)) {
    throw new Error(`Compiled Grade 1 ${label} ids are malformed.`);
  }
  const entries: (readonly [string, number])[] = [];
  for (const [key, id] of value) {
    if (typeof key !== "string" || typeof id !== "number" || !Number.isInteger(id)) {
      throw new Error(`Compiled Grade 1 ${label} ids are malformed.`);
    }
    entries.push([key, id]);
  }
  return Object.fromEntries(entries);
}

function provenanceIds(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Compiled Grade 1 ${label} provenance is malformed.`);
  }
  return value.map((entry): string => {
    const id = isRecord(entry) ? entry["id"] : undefined;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`Compiled Grade 1 ${label} provenance is malformed.`);
    }
    return id;
  });
}

function loadCompilation(imported: unknown): LoadedCompilation {
  if (!isRecord(imported)) {
    throw new Error("Compiled Grade 1 module is malformed.");
  }
  const modes = imported["GRADE1_MODE_COMPILATION"];
  const policies = imported["COMPOSITION_POLICY_COMPILATION"];
  const symbols = imported["GRADE1_SYMBOL_COMPILATION"];
  const initialElisionWords: unknown = imported["INITIAL_ELISION_WORDS"];
  if (!Array.isArray(initialElisionWords) || !initialElisionWords.every(
    (word): word is string => typeof word === "string" && /^[a-z]+$/u.test(word),
  )) throw new Error("Compiled initial elision dictionary is malformed.");
  if (!isRecord(modes) || !isRecord(policies) || !isRecord(symbols)) {
    throw new Error("Compiled Grade 1 module lacks its compilations.");
  }
  const facts: unknown = imported["GRADE1_RUNTIME_FACTS"];
  if (!isRecord(facts)) throw new Error("Compiled Grade 1 runtime facts are malformed.");
  return {
    facts,
    classIds: idObject(modes["classIds"], "class"),
    initialElisionWords,
    modeIds: idObject(modes["modeIds"], "mode"),
    modeRuleIds: provenanceIds(modes["provenance"], "mode"),
    modes: modeProgram(modes["runtime"]),
    policies: compositionPolicies(policies["runtime"]),
    policyRuleIds: provenanceIds(policies["provenance"], "policy"),
    symbolRuleIds: provenanceIds(symbols["provenance"], "symbol"),
    symbols: symbolProgram(symbols["runtime"]),
    technical: technicalProgram(imported["TECHNICAL_SIGN_PROGRAM"]),
  };
}

function generatedProgram(compilation: LoadedCompilation): string {
  return "// Generated by scripts/generate-grade1.mts. Do not edit.\n" +
    'import type { ModeProgram } from "../../mode-engine.js";\n' +
    'import type { CompositionPolicies } from "../../composition.js";\n' +
    'import type { SymbolProgram } from "../../symbol-program.js";\n' +
    'type UebProgram<Program> = Program & { readonly code: "ueb-2024" };\n' +
    `export const INITIAL_ELISION_WORDS: readonly string[] = ${JSON.stringify(compilation.initialElisionWords)};\n` +
    `export const GRADE1_RUNTIME_FACTS = ${JSON.stringify(compilation.facts, undefined, 2)} as const;\n` +
    `export const GRADE1_MODE_PROGRAM: UebProgram<ModeProgram> = ${JSON.stringify({ code: "ueb-2024", ...compilation.modes }, undefined, 2)};\n` +
    `export const UEB_COMPOSITION_POLICIES: UebProgram<CompositionPolicies> = ${JSON.stringify({ code: "ueb-2024", ...compilation.policies }, undefined, 2)};\n` +
    `export const GRADE1_SYMBOL_PROGRAM: UebProgram<SymbolProgram> = ${JSON.stringify({ code: "ueb-2024", ...compilation.symbols }, undefined, 2)};\n` +
    `export const GRADE1_MODE_IDS = ${JSON.stringify(compilation.modeIds, undefined, 2)};\n` +
    `export const GRADE1_MODE_CLASS_IDS = ${JSON.stringify(compilation.classIds, undefined, 2)};\n`;
}

function generatedProvenance(compilation: LoadedCompilation): string {
  return "// Generated by scripts/generate-grade1.mts. Do not edit.\n" +
    `export const GRADE1_MODE_RULE_IDS: readonly string[] = ${JSON.stringify(compilation.modeRuleIds, undefined, 2)};\n` +
    `export const COMPOSITION_POLICY_RULE_IDS: readonly string[] = ${JSON.stringify(compilation.policyRuleIds, undefined, 2)};\n` +
    `export const GRADE1_SYMBOL_RULE_IDS: readonly string[] = ${JSON.stringify(compilation.symbolRuleIds, undefined, 2)};\n`;
}

async function emit(path: string, content: string, check: boolean): Promise<void> {
  if (check) {
    const current = await readFile(path, "utf8");
    if (current !== content) {
      throw new Error(`${path} is not reproducible; run npm run grade1:generate.`);
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
await emit(generatedProgramPath, generatedProgram(compilation), check);
await emit(generatedProvenancePath, generatedProvenance(compilation), check);
await emit(generatedTechnicalPath,
  "// Generated by scripts/generate-grade1.mts. Do not edit.\n" +
  'import type { TechnicalSignProgram } from "../../technical-program.js";\n' +
  `export const TECHNICAL_SIGN_PROGRAM: TechnicalSignProgram = ${JSON.stringify(compilation.technical, undefined, 2)};\n`,
  check);
