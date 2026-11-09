/** The one run of expansion-pipeline.json over the authored sources. */
import { CITATION_DOCUMENT_DATA, sourceData } from "./source-manifest.js";
import { runPipeline, toJson, type Json } from "./pipeline.js";
import { SYMBOL_RULES } from "./symbols/source.js";

const INPUTS = ["expansion", "groups", "families", "shortforms", "appendix", "constraints",
  "longerShortforms", "shortformSuffixes"] as const;

/** Run the pipeline over the authored sources, with named inputs replaced (tests change one source). */
export function expandSources(overrides: Readonly<Record<string, unknown>> = {}): Readonly<Record<string, readonly Json[]>> {
  const inputs: Record<string, Json> = {
    documents: toJson(CITATION_DOCUMENT_DATA),
    symbols: toJson(SYMBOL_RULES),
    ...Object.fromEntries(INPUTS.map((name) => [name, toJson(sourceData(name))])),
  };
  for (const [name, value] of Object.entries(overrides)) inputs[name] = toJson(value);
  return runPipeline(toJson(sourceData("pipeline")), inputs);
}

export const EXPANSION: Readonly<Record<string, readonly Json[]>> = expandSources();

export function expansionTable(name: string): readonly Json[] {
  const table = EXPANSION[name];
  if (table === undefined || !Object.hasOwn(EXPANSION, name)) throw new Error(`Pipeline has no output ${name}.`);
  return table;
}
