import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { OracleComparison } from "../src/differential.js";
import {
  parseDisagreementLedger,
  reconcileDisagreements,
} from "../src/ledger.js";

const disagreement = {
  error: {
    code: "translation-disagreement",
    message: "case-1 disagrees; adjudicate against ICEB",
  },
  evidence: {
    caseId: "case-1",
    input: "and",
    local: { kind: "rule", output: "⠯", ruleId: "UEB-10.3-and" },
    oracle: {
      engine: "liblouis",
      output: "⠁⠝⠙",
      status: "non-normative development oracle; ICEB sources decide disagreements",
      tables: ["en-ueb-g2.ctb"],
      version: "3.38.0",
    },
  },
  kind: "disagreement",
  ok: false,
} satisfies OracleComparison;

const ledgerEntry = {
  ...disagreement.evidence,
  verdict: {
    kind: "liblouis-bug",
    rationale: "ICEB Rule 10.3 requires the strong contraction here.",
    sources: ["https://iceb.org/publications/ueb/"],
  },
} as const;

describe("tracked Liblouis disagreement ledger", () => {
  it("accepts only verdict-annotated evidence with official normative sources", () => {
    expect(parseDisagreementLedger({ disagreements: [ledgerEntry], version: 1 }))
      .toEqual({
        ledger: { disagreements: [ledgerEntry], version: 1 },
        ok: true,
      });

    for (const verdict of [
      "our-bug",
      "liblouis-bug",
      "permitted-alternative",
    ] as const) {
      expect(
        parseDisagreementLedger({
          disagreements: [{
            ...ledgerEntry,
            verdict: { ...ledgerEntry.verdict, kind: verdict },
          }],
          version: 1,
        }).ok,
      ).toBe(true);
    }
  });

  it.each([
    [undefined, "ledger must be an object"],
    [{ disagreements: [], extra: true, version: 1 }, "unknown ledger field: extra"],
    [{ disagreements: [], version: 2 }, "version must be 1"],
    [{ disagreements: null, version: 1 }, "disagreements must be an array"],
    [{ disagreements: [null], version: 1 }, "disagreement must be an object"],
    [
      { disagreements: [{ ...ledgerEntry, extra: true }], version: 1 },
      "unknown disagreement field: extra",
    ],
    [
      { disagreements: [{ ...ledgerEntry, caseId: "" }], version: 1 },
      "caseId must be a non-empty string",
    ],
    [
      { disagreements: [{ ...ledgerEntry, input: null }], version: 1 },
      "input must be a string",
    ],
    [
      { disagreements: [{ ...ledgerEntry, local: null }], version: 1 },
      "local must be an object",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          local: { ...ledgerEntry.local, extra: true },
        }],
        version: 1,
      },
      "unknown local field: extra",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          local: { ...ledgerEntry.local, output: null },
        }],
        version: 1,
      },
      "local.output must be a string",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          local: { kind: "rule", output: "cells", ruleId: "" },
        }],
        version: 1,
      },
      "local.ruleId must be a non-empty string",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          local: { kind: "test", output: "cells", testId: "" },
        }],
        version: 1,
      },
      "local.testId must be a non-empty string",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          local: { kind: "invalid", output: "cells" },
        }],
        version: 1,
      },
      "local.kind must be rule or test",
    ],
    [
      { disagreements: [{ ...ledgerEntry, oracle: null }], version: 1 },
      "oracle must be an object",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          oracle: { ...ledgerEntry.oracle, extra: true },
        }],
        version: 1,
      },
      "unknown oracle field: extra",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          oracle: { ...ledgerEntry.oracle, engine: "other" },
        }],
        version: 1,
      },
      "oracle evidence is incomplete",
    ],
    [
      { disagreements: [{ ...ledgerEntry, verdict: undefined }], version: 1 },
      "verdict must be an object",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, extra: true },
        }],
        version: 1,
      },
      "unknown verdict field: extra",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, kind: "invalid" },
        }],
        version: 1,
      },
      "verdict.kind must be our-bug, liblouis-bug, or permitted-alternative",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, rationale: "" },
        }],
        version: 1,
      },
      "verdict.rationale must be a non-empty string",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, sources: ["https://example.com/"] },
        }],
        version: 1,
      },
      "verdict.sources must contain only official ICEB or BANA URLs",
    ],
    [
      {
        disagreements: [{
          ...ledgerEntry,
          verdict: { ...ledgerEntry.verdict, sources: ["not-a-url"] },
        }],
        version: 1,
      },
      "verdict.sources must contain only official ICEB or BANA URLs",
    ],
    [
      { disagreements: [ledgerEntry, ledgerEntry], version: 1 },
      "duplicate disagreement caseId: case-1",
    ],
  ])("rejects an untriaged or non-normative ledger: %s", (value, error) => {
    expect(parseDisagreementLedger(value)).toEqual({ error, ok: false });
  });

  it("fails closed on a new or changed disagreement", () => {
    expect(reconcileDisagreements([disagreement], {
      disagreements: [],
      version: 1,
    })).toEqual({
      ok: false,
      stale: [],
      untriaged: [disagreement.evidence],
    });

    const changed = {
      ...disagreement,
      evidence: {
        ...disagreement.evidence,
        local: { ...disagreement.evidence.local, output: "changed" },
      },
    } satisfies OracleComparison;
    expect(reconcileDisagreements([changed], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toMatchObject({
      ok: false,
      stale: [ledgerEntry],
      untriaged: [changed.evidence],
    });
  });

  it("accepts exactly matching triaged evidence and reports stale entries", () => {
    expect(reconcileDisagreements([disagreement], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toEqual({ ok: true, stale: [], untriaged: [] });

    expect(reconcileDisagreements([], {
      disagreements: [ledgerEntry],
      version: 1,
    })).toEqual({
      ok: false,
      stale: [ledgerEntry],
      untriaged: [],
    });

    const testDisagreement = {
      ...disagreement,
      evidence: {
        ...disagreement.evidence,
        caseId: "test-case",
        local: { kind: "test", output: "local", testId: "test/id" },
      },
    } satisfies OracleComparison;
    const testLedgerEntry = {
      ...testDisagreement.evidence,
      verdict: ledgerEntry.verdict,
    };
    expect(reconcileDisagreements([testDisagreement], {
      disagreements: [testLedgerEntry],
      version: 1,
    })).toEqual({ ok: true, stale: [], untriaged: [] });
  });

  it("keeps the repository ledger parseable and fully triaged", () => {
    const source = readFileSync(
      new URL("../disagreements.json", import.meta.url),
      "utf8",
    );
    expect(parseDisagreementLedger(JSON.parse(source))).toMatchObject({
      ok: true,
    });
  });
});
