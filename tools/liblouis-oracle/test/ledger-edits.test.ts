import { describe, expect, it } from "vitest";

import type { ComparisonEvidence } from "../src/differential.js";
import { parseEmpiricalLedger } from "../src/empirical-ledger.js";
import { comparisonEvidenceDigest, type DisagreementVerdict } from "../src/ledger.js";
import {
  addLedgerEvidence,
  regroupLedgerEvidence,
  supersedeLedgerEvidence,
} from "../src/ledger-edits.js";

function evidence(input: string, local: string, oracle: string): ComparisonEvidence {
  return {
    caseId: `scowl:test:${input}`,
    input,
    local: { kind: "test", output: local, testId: "SCOWL-test" },
    oracle: {
      engine: "liblouis", output: oracle, status: "development oracle",
      tables: ["en-ueb-g2.ctb"], version: "3.38.0",
    },
  };
}

const permitted: DisagreementVerdict = {
  kind: "permitted-alternative",
  rationale: "Existing reviewed rationale.",
  sources: ["https://iceb.org/publications/ueb/"],
};
const oracleBug: DisagreementVerdict = {
  kind: "liblouis-bug",
  rationale: "One-syllable bein: be is not a first syllable (10.6.1).",
  sources: ["https://iceb.org/publications/ueb/"],
};

const existing = evidence("beardstown", "⠃⠑⠜⠙⠌⠪⠝", "⠃⠑⠜⠙⠎⠞⠪⠝");
const adamstown = evidence("adamstown", "⠁⠙⠁⠍⠌⠪⠝", "⠁⠙⠁⠍⠎⠞⠪⠝");
const baseLedger = {
  disagreements: [{ ...existing, groupId: "traced-be-con-dis" }],
  groups: [
    { id: "traced-be-con-dis", verdict: permitted },
    { id: "traced-strong-groupsign", verdict: permitted },
  ],
  version: 2,
};
// A ledger must not carry unused groups, so the fixture keeps one member in each.
const ledger = {
  ...baseLedger,
  disagreements: [
    ...baseLedger.disagreements,
    { ...adamstown, groupId: "traced-strong-groupsign" },
  ],
};

describe("adding reviewed evidence to the ledger", () => {
  it("creates a new group with its reviewed verdict", () => {
    const added = evidence("beinly", "⠃⠑⠔⠇⠽", "⠆⠔⠇⠽");
    const result = addLedgerEvidence(ledger, [added], "one-syllable-be", oracleBug);
    expect(parseEmpiricalLedger(result).ok).toBe(true);
    expect(result["groups"]).toContainEqual({ id: "one-syllable-be", verdict: oracleBug });
    expect(result["disagreements"]).toContainEqual({ ...added, groupId: "one-syllable-be" });
  });

  it("joins an existing group without restating its verdict", () => {
    const added = evidence("abbottstown", "⠁⠆⠕⠞⠞⠌⠪⠝", "⠁⠆⠕⠞⠞⠎⠞⠪⠝");
    const result = addLedgerEvidence(ledger, [added], "traced-strong-groupsign");
    expect(result["disagreements"]).toContainEqual({ ...added, groupId: "traced-strong-groupsign" });
    expect(result["groups"]).toEqual(ledger.groups);
  });

  it("refuses ambiguous group intent, duplicates, and empty batches", () => {
    const added = evidence("beinly", "⠃⠑⠔⠇⠽", "⠆⠔⠇⠽");
    expect(() => addLedgerEvidence(ledger, [added], "traced-strong-groupsign", oracleBug))
      .toThrow("already exists");
    expect(() => addLedgerEvidence(ledger, [added], "one-syllable-be"))
      .toThrow("needs a reviewed verdict");
    expect(() => addLedgerEvidence(ledger, [existing], "traced-strong-groupsign"))
      .toThrow("already in the ledger");
    expect(() => addLedgerEvidence(ledger, [added, added], "one-syllable-be", oracleBug))
      .toThrow("already in the ledger");
    expect(() => addLedgerEvidence(ledger, [], "one-syllable-be", oracleBug))
      .toThrow("at least one");
  });
});

describe("superseding audited evidence that still disagrees", () => {
  const before = evidence("beardstown", "⠆⠜⠙⠌⠪⠝", "⠃⠑⠜⠙⠎⠞⠪⠝");
  const after = evidence("beardstown", "⠃⠑⠜⠙⠌⠪⠝", "⠃⠑⠜⠙⠎⠞⠪⠝");
  const staleLedger = {
    ...ledger,
    disagreements: [
      { ...before, groupId: "traced-be-con-dis" },
      ...ledger.disagreements.slice(1),
    ],
  };

  it("replaces the old evidence in place under the group that describes the residual", () => {
    const result = supersedeLedgerEvidence(staleLedger, [{ after, before }], "traced-strong-groupsign");
    expect(parseEmpiricalLedger(result).ok).toBe(true);
    expect(result["disagreements"]).toEqual([
      { ...after, groupId: "traced-strong-groupsign" },
      ...ledger.disagreements.slice(1),
    ]);
    expect(result["groups"]).toEqual([{ id: "traced-strong-groupsign", verdict: permitted }]);
  });

  it("refuses agreements, missing originals, and evidence that is already present", () => {
    const agreed = evidence("beardstown", "⠃⠑⠜⠙⠎⠞⠪⠝", "⠃⠑⠜⠙⠎⠞⠪⠝");
    expect(() => supersedeLedgerEvidence(staleLedger, [{ after: agreed, before }], "traced-strong-groupsign"))
      .toThrow("now agrees");
    expect(() => supersedeLedgerEvidence(ledger, [{ after, before }], "traced-strong-groupsign"))
      .toThrow("not in the ledger");
    expect(() => supersedeLedgerEvidence(staleLedger, [{ after: adamstown, before }], "traced-strong-groupsign"))
      .toThrow("already in the ledger");
    expect(() => supersedeLedgerEvidence(staleLedger, [{ after, before }], "missing-group"))
      .toThrow("Unknown group");
  });
});

describe("regrouping ledger evidence", () => {
  it("moves evidence to the group whose verdict describes it and drops emptied groups", () => {
    const result = regroupLedgerEvidence(
      ledger, [comparisonEvidenceDigest(existing)], "traced-strong-groupsign",
    );
    expect(parseEmpiricalLedger(result).ok).toBe(true);
    expect(result["disagreements"]).toContainEqual({ ...existing, groupId: "traced-strong-groupsign" });
    expect(result["groups"]).toEqual([{ id: "traced-strong-groupsign", verdict: permitted }]);
  });

  it("refuses unknown groups and digests that are absent", () => {
    const digest = comparisonEvidenceDigest(existing);
    expect(() => regroupLedgerEvidence(ledger, [digest], "missing-group"))
      .toThrow("Unknown group");
    expect(() => regroupLedgerEvidence(ledger, ["0".repeat(64)], "traced-strong-groupsign"))
      .toThrow("not in the ledger");
    expect(() => regroupLedgerEvidence(ledger, [], "traced-strong-groupsign"))
      .toThrow("at least one");
  });
});
