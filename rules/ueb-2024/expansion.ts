/** The one run of expansion-pipeline.json over the authored sources. */
import { CITATION_DOCUMENT_DATA, sourceData } from "./source-manifest.js";
import { record, runPipeline, toJson, type Json } from "./pipeline.js";
import { SYMBOL_RULES } from "./symbols/source.js";

/** Run the pipeline over the inputs sources.json routes to it, with named inputs replaced (tests change one source). */
export function expandSources(overrides: Readonly<Record<string, unknown>> = {}): Readonly<Record<string, readonly Json[]>> {
  const routed = record(toJson(sourceData("pipeline", "inputs")));
  const inputs = record(toJson({ documents: CITATION_DOCUMENT_DATA, symbols: SYMBOL_RULES, ...routed, ...overrides }));
  return runPipeline(toJson(sourceData("pipeline", "program")), inputs);
}

export const EXPANSION: Readonly<Record<string, readonly Json[]>> = expandSources();

export function expansionTable(name: string): readonly Json[] {
  const table = EXPANSION[name];
  if (table === undefined || !Object.hasOwn(EXPANSION, name)) throw new Error(`Pipeline has no output ${name}.`);
  return table;
}
