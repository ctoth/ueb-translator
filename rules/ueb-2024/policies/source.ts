import rulesData from "./rules.json" with { type: "json" };
import { readCompositionRules } from "../rule-json.js";

import type { CompositionPolicySource } from "./compiler.js";

export const COMPOSITION_POLICY_RULES: readonly CompositionPolicySource[] = readCompositionRules(rulesData);
