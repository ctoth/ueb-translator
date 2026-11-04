import { sourceFile, SYMBOL_FAMILY_DATA } from "../source-manifest.js";
import { readSymbolFamilies } from "../rule-json.js";
import { expandSymbolSources, type SymbolRuleSource } from "./compiler.js";

export const SYMBOL_RULES: readonly SymbolRuleSource[] = expandSymbolSources(
  readSymbolFamilies(SYMBOL_FAMILY_DATA), sourceFile,
);
