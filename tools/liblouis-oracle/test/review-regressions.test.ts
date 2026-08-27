import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  parseReviewRegressionLedger,
  REVIEW_REGRESSION_CASES,
} from "../src/review-regressions.js";

describe("2026-08 confirmed review evidence", () => {
  it("retains a pre-fix oracle probe for every epic-listed confirmed bug", () => {
    expect(REVIEW_REGRESSION_CASES.map((case_) => case_.issue)).toEqual([
      22, 26, 28, 29, 29, 30, 34, 34, 35, 35, 36, 44, 45,
    ]);
    expect(REVIEW_REGRESSION_CASES.map((case_) => case_.preFix))
      .toEqual(Array.from({ length: 13 }, () => true));
    expect(new Set(REVIEW_REGRESSION_CASES.map((case_) => case_.caseId)).size)
      .toBe(REVIEW_REGRESSION_CASES.length);
  });

  it("keeps lossless actual/assertion evidence without flattening structured inputs", () => {
    const source = readFileSync(
      new URL("../review-regressions.json", import.meta.url),
      "utf8",
    );
    const parsed = parseReviewRegressionLedger(JSON.parse(source));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.ledger.cases).toHaveLength(13);
      expect(parsed.ledger.cases.filter(({ oracle }) =>
        oracle.kind === "unrepresentable"
      )).toHaveLength(7);
      expect(parsed.ledger.cases.every(({ input }) =>
        typeof input.adapter === "string" && input.value !== undefined
      )).toBe(true);
    }
  });
});
