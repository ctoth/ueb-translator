import latinData from "./latin.json" with { type: "json" };
import modifiersData from "./modifiers.json" with { type: "json" };
import greekData from "./greek.json" with { type: "json" };
import generalSymbolsData from "./general-symbols.json" with { type: "json" };
import specialData from "./special.json" with { type: "json" };
import verticalBarData from "./vertical-bar.json" with { type: "json" };
import { readPairs, readSymbolRules } from "../rule-json.js";
import { expandSymbolSources, type SymbolRuleSource } from "./compiler.js";

export const SYMBOL_RULES: readonly SymbolRuleSource[] = expandSymbolSources(
  readPairs(latinData), readPairs(modifiersData), readPairs(greekData), readPairs(generalSymbolsData),
  readSymbolRules(specialData), readSymbolRules(verticalBarData),
);
