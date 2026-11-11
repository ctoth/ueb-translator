/** The one run of technical-pipeline.json over the technical sources. */
import { CITATION_DOCUMENT_DATA, sourceData } from "./source-manifest.js";
import { record, runPipeline, toJson, type Json } from "./pipeline.js";
import { readSymbolRules } from "./rule-json.js";
import { compileSymbols, type SymbolRuleSource } from "./symbols/compiler.js";
import { SYMBOL_RULES } from "./symbols/source.js";
import { isTechnicalLayouts } from "../../src/technical-program.js";

/**
 * Run the pipeline over the inputs sources.json routes to it (tests replace named inputs or the
 * general symbols). The pipeline's one output row is the compiled technical program.
 */
export function compileTechnicalSigns(
  overrides: Readonly<Record<string, unknown>> = {}, general: readonly SymbolRuleSource[] = SYMBOL_RULES,
): Readonly<Record<string, Json>> {
  const sources = { ...record(toJson(sourceData("technical", "inputs"))), ...overrides };
  const compiled = compileSymbols([...general, ...readSymbolRules(sources["symbols"])]).runtime.symbols;
  const inputs = record(toJson({ documents: CITATION_DOCUMENT_DATA, compiled, ...sources }));
  const [program] = Object.values(runPipeline(toJson(sourceData("technical", "program")), inputs)).flat();
  const result = record(toJson(program));
  if (!isTechnicalLayouts(result["layouts"])) throw new Error("Technical layouts are malformed.");
  return result;
}
