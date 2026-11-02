import inventoryData from "./inventory.json" with { type: "json" };
import { readInventory } from "./rule-json.js";
export const GRADE2_INVENTORY_COUNTS: ReturnType<typeof readInventory> = readInventory(inventoryData);
