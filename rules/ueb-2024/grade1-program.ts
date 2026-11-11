import { compileModes, type ModeCompilationResult } from "./modes/compiler.js";
import { readRuntimeFacts } from "./rule-json.js";
import { sourceData } from "./source-manifest.js";
import { MODE_RULES } from "./modes/source.js";
import {
  compileCompositionPolicies,
  type CompositionPolicyCompilation,
} from "./policies/compiler.js";
import { COMPOSITION_POLICY_RULES } from "./policies/source.js";
import { compileSymbols, type SymbolCompilationResult } from "./symbols/compiler.js";
import { SYMBOL_RULES } from "./symbols/source.js";
import type { Json } from "./pipeline.js";
import { compileTechnicalSigns } from "./technical-signs.js";

export const GRADE1_MODE_COMPILATION: ModeCompilationResult = compileModes(MODE_RULES);
export const COMPOSITION_POLICY_COMPILATION: CompositionPolicyCompilation =
  compileCompositionPolicies(COMPOSITION_POLICY_RULES);
export const GRADE1_SYMBOL_COMPILATION: SymbolCompilationResult = compileSymbols(SYMBOL_RULES);
/** Typed as TechnicalSignProgram where the generator emits it; tsc checks its shape there. */
export const TECHNICAL_SIGN_PROGRAM: Readonly<Record<string, Json>> = compileTechnicalSigns();
export { INITIAL_ELISION_WORDS } from "./apostrophes.js";
export const GRADE1_RUNTIME_FACTS: ReturnType<typeof readRuntimeFacts> = readRuntimeFacts(sourceData("facts"));
