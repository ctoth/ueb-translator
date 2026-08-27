import { compileModes, type ModeCompilationResult } from "./modes/compiler.js";
import { MODE_RULES } from "./modes/source.js";
import { compileSymbols, type SymbolCompilationResult } from "./symbols/compiler.js";
import { SYMBOL_RULES } from "./symbols/source.js";

export const GRADE1_MODE_COMPILATION: ModeCompilationResult = compileModes(MODE_RULES);
export const GRADE1_SYMBOL_COMPILATION: SymbolCompilationResult = compileSymbols(SYMBOL_RULES);
