import { sourceData } from "./source-manifest.js";
import { readInventory } from "./rule-json.js";
export const GRADE2_INVENTORY_COUNTS: ReturnType<typeof readInventory> = readInventory(sourceData("inventory"));
