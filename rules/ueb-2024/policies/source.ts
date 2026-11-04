import { sourceData } from "../source-manifest.js";
import { readCompositionRules } from "../rule-json.js";

import type { CompositionPolicySource } from "./compiler.js";

export const COMPOSITION_POLICY_RULES: readonly CompositionPolicySource[] = readCompositionRules(sourceData("policies"));
