import { sourceData } from "./source-manifest.js";
import { readInventory } from "./rule-json.js";
export const GRADE2_INVENTORY_COUNTS: ReturnType<typeof readInventory> = readInventory(sourceData("inventory"));

export function validateInventory(
  expected: ReturnType<typeof readInventory>, actual: ReturnType<typeof readInventory>,
): void {
  for (const key of ["rules", "contextualRules", "shortforms", "appendix1LongerWords"] as const) {
    if (expected[key] !== actual[key]) throw new Error(`Inventory ${key}: expected ${expected[key]}, produced ${actual[key]}`);
  }
}
