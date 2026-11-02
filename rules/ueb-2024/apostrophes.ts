import apostrophesData from "./apostrophes.json" with { type: "json" };
import { readStrings } from "./rule-json.js";
/**
 * Initial elisions for the software dictionary recommended by UEB 7.6.14.
 * Spellings are case-insensitive; the apostrophe itself is matched separately.
 */
export const INITIAL_ELISION_WORDS: readonly string[] = readStrings(apostrophesData);
