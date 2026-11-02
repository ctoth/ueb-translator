import { compileModes, type ModeCompilationResult } from "./modes/compiler.js";
import { MODE_RULES } from "./modes/source.js";
import {
  compileCompositionPolicies,
  type CompositionPolicyCompilation,
} from "./policies/compiler.js";
import { COMPOSITION_POLICY_RULES } from "./policies/source.js";
import { compileSymbols, type SymbolCompilationResult } from "./symbols/compiler.js";
import { SYMBOL_RULES } from "./symbols/source.js";
import type { TechnicalSignProgram } from "../../src/technical-program.js";
import {
  compileTechnicalSigns, TECHNICAL_GRADE1_PROTECTION_RULES, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_ITEM_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_MODIFIER_RULES, TECHNICAL_SCRIPT_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SYMBOL_RULES,
} from "./technical-signs.js";

export const GRADE1_MODE_COMPILATION: ModeCompilationResult = compileModes(MODE_RULES);
export const COMPOSITION_POLICY_COMPILATION: CompositionPolicyCompilation =
  compileCompositionPolicies(COMPOSITION_POLICY_RULES);
export const GRADE1_SYMBOL_COMPILATION: SymbolCompilationResult = compileSymbols(SYMBOL_RULES);
export const TECHNICAL_SIGN_PROGRAM: TechnicalSignProgram = compileTechnicalSigns(
  SYMBOL_RULES, TECHNICAL_SYMBOL_RULES, TECHNICAL_SIGN_MAPPINGS, TECHNICAL_SCRIPT_RULES,
  TECHNICAL_MODIFIER_RULES, TECHNICAL_SHAPE_RULES, TECHNICAL_DELIMITER_RULES, TECHNICAL_ITEM_RULES, TECHNICAL_VALUE_PATTERNS, TECHNICAL_OPERATION_SPACING_RULES, TECHNICAL_GRADE1_PROTECTION_RULES,
);
export { INITIAL_ELISION_WORDS } from "./apostrophes.js";
