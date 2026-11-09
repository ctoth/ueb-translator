import source0 from "./citation-documents.json" with { type: "json" };
import engine from "./contextual-engine.json" with { type: "json" };
import facts from "./runtime-facts.json" with { type: "json" };
import pipeline from "./expansion-pipeline.json" with { type: "json" };
import vocabulary from "./grade1-vocabulary.json" with { type: "json" };
import expansion from "./expansion-policy.json" with { type: "json" };
import source1 from "./modes/rules.json" with { type: "json" };
import source2 from "./policies/rules.json" with { type: "json" };
import source3 from "./grade2-rules.json" with { type: "json" };
import source4 from "./grade2-families.json" with { type: "json" };
import source5 from "./shortforms.json" with { type: "json" };
import source6 from "./appendix1.json" with { type: "json" };
import source7 from "./constraints.json" with { type: "json" };
import source8 from "./apostrophes.json" with { type: "json" };
import source9 from "./longer-shortforms.json" with { type: "json" };
import source10 from "./shortform-suffixes.json" with { type: "json" };
import source11 from "./inventory.json" with { type: "json" };
import source12 from "./technical-sign-mappings.json" with { type: "json" };
import source13 from "./technical-symbol-rules.json" with { type: "json" };
import source14 from "./technical-script-rules.json" with { type: "json" };
import source15 from "./technical-modifier-rules.json" with { type: "json" };
import source16 from "./technical-shape-rules.json" with { type: "json" };
import source17 from "./technical-delimiter-rules.json" with { type: "json" };
import source18 from "./technical-item-rules.json" with { type: "json" };
import source19 from "./technical-value-patterns.json" with { type: "json" };
import source20 from "./technical-operation-spacing-rules.json" with { type: "json" };
import source21 from "./technical-grade1-protection-rules.json" with { type: "json" };
import source22 from "./technical-function-spacing-rules.json" with { type: "json" };
import source23 from "./technical-numeric-continuation-rules.json" with { type: "json" };
import source24 from "./technical-computer-whitespace-rules.json" with { type: "json" };
import layouts from "./technical-layout-rules.json" with { type: "json" };
import source25 from "./symbols/latin.json" with { type: "json" };
import source26 from "./symbols/modifiers.json" with { type: "json" };
import source27 from "./symbols/greek.json" with { type: "json" };
import source28 from "./symbols/special.json" with { type: "json" };
import source29 from "./symbols/general-symbols.json" with { type: "json" };
import source30 from "./symbols/vertical-bar.json" with { type: "json" };

/** Static imports are transport only; sources.json owns assembly and ordering. */
export const SOURCE_FILES: Readonly<Record<string, unknown>> = {
  "contextual-engine.json": engine,
  "runtime-facts.json": facts,
  "expansion-pipeline.json": pipeline,
  "expansion-policy.json": expansion,
  "grade1-vocabulary.json": vocabulary,
  "citation-documents.json": source0,
  "modes/rules.json": source1,
  "policies/rules.json": source2,
  "grade2-rules.json": source3,
  "grade2-families.json": source4,
  "shortforms.json": source5,
  "appendix1.json": source6,
  "constraints.json": source7,
  "apostrophes.json": source8,
  "longer-shortforms.json": source9,
  "shortform-suffixes.json": source10,
  "inventory.json": source11,
  "technical-sign-mappings.json": source12,
  "technical-symbol-rules.json": source13,
  "technical-script-rules.json": source14,
  "technical-modifier-rules.json": source15,
  "technical-shape-rules.json": source16,
  "technical-delimiter-rules.json": source17,
  "technical-item-rules.json": source18,
  "technical-value-patterns.json": source19,
  "technical-operation-spacing-rules.json": source20,
  "technical-grade1-protection-rules.json": source21,
  "technical-function-spacing-rules.json": source22,
  "technical-numeric-continuation-rules.json": source23,
  "technical-computer-whitespace-rules.json": source24,
  "technical-layout-rules.json": layouts,
  "symbols/latin.json": source25,
  "symbols/modifiers.json": source26,
  "symbols/greek.json": source27,
  "symbols/special.json": source28,
  "symbols/general-symbols.json": source29,
  "symbols/vertical-bar.json": source30,
};
