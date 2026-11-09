/** Grade 2 program: expansion-pipeline.json outputs, lowered by the contextual compiler. */
import { APPENDIX1_LONGER_WORDS } from "./appendix1.js";
import {
  compileContextualRules,
  type ContextualCompilationResult,
  type ContextualRuleSource,
} from "./contextual-compiler.js";
import { expansionTable } from "./expansion.js";
import { GRADE2_RULES } from "./grade2-rules.js";
import { GRADE2_INVENTORY_COUNTS, validateInventory } from "./inventory.js";
import { readExpandedContextualRule, readPairs, readStrings } from "./rule-json.js";
import { SHORTFORMS } from "./shortforms.js";

export const GRADE2_CONTEXTUAL_RULES: readonly ContextualRuleSource[] =
  expansionTable("rules").map(readExpandedContextualRule);

/** ICEB 10.9.8–9: the general longer-word readings of 10.9.3. */
export const GRADE2_AMBIGUOUS_LONGER_PATTERNS: readonly string[] = readStrings(expansionTable("longerAmbiguities"));

/** ICEB 10.9.7: literal letter sequences whose cells are also a contraction output. */
export const GRADE2_AMBIGUOUS_LETTER_SEQUENCES: readonly (readonly [print: string, braille: string])[] =
  readPairs(expansionTable("ambiguities"));

/** Groupsigns that must be written literally when standing alone (UEB 10.4.2). */
export const GRADE2_STANDING_LITERAL_INPUTS: readonly string[] = readStrings(expansionTable("standingLiterals"));

export const GRADE2_CONTEXTUAL_COMPILATION: ContextualCompilationResult = compileContextualRules(
  GRADE2_CONTEXTUAL_RULES,
  readStrings(expansionTable("alphabet")),
);

validateInventory(GRADE2_INVENTORY_COUNTS, {
  rules: GRADE2_RULES.length, contextualRules: GRADE2_CONTEXTUAL_COMPILATION.runtime.rules.length,
  shortforms: SHORTFORMS.length, appendix1LongerWords: APPENDIX1_LONGER_WORDS.length,
});
