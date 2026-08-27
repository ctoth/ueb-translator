import { compileModes, type ModeCompilationResult } from "./modes/compiler.js";
import { MODE_RULES } from "./modes/source.js";
import {
  compileCompositionPolicies,
  type CompositionPolicyCompilation,
} from "./policies/compiler.js";
import { COMPOSITION_POLICY_RULES } from "./policies/source.js";
import { compileSymbols, type SymbolCompilationResult } from "./symbols/compiler.js";
import { SYMBOL_RULES } from "./symbols/source.js";

export const GRADE1_MODE_COMPILATION: ModeCompilationResult = compileModes(MODE_RULES);
export const COMPOSITION_POLICY_COMPILATION: CompositionPolicyCompilation =
  compileCompositionPolicies(COMPOSITION_POLICY_RULES);
export const GRADE1_SYMBOL_COMPILATION: SymbolCompilationResult = compileSymbols(SYMBOL_RULES);
