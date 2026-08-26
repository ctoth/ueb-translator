import { describe, expect, it } from "vitest";

import {
  compareOracleTranslation,
  parseDifferentialCase,
  parseDifferentialCaseLine,
} from "../src/differential.js";
import type { OracleTranslation } from "../src/runner.js";

const oracle: OracleTranslation = {
  id: "case-1",
  ok: true,
  oracle: {
    engine: "liblouis",
    status: "non-normative development oracle; ICEB sources decide disagreements",
    tables: ["en-ueb-g2.ctb"],
    version: "3.38.0",
  },
  output: "⠯",
};

describe("Liblouis differential case protocol", () => {
  it("accepts explicit rule and test provenance variants", () => {
    expect(
      parseDifferentialCaseLine(
        '{"caseId":"case-1","local":{"kind":"rule","ruleId":"ueb-2024:10.5.1"},"localOutput":"⠯","mode":"grade2","print":"and"}',
      ),
    ).toEqual({
      case: {
        caseId: "case-1",
        local: { kind: "rule", ruleId: "ueb-2024:10.5.1" },
        localOutput: "⠯",
        mode: "grade2",
        print: "and",
      },
      ok: true,
    });
    expect(
      parseDifferentialCase({
        caseId: "case-2",
        local: { kind: "test", testId: "grade1 capitals property" },
        localOutput: "⠠⠁",
        mode: "grade1",
        print: "A",
      }),
    ).toMatchObject({
      case: { local: { kind: "test", testId: "grade1 capitals property" } },
      ok: true,
    });
  });

  it.each([
    [null, "case must be a JSON object"],
    [{ caseId: "x", extra: true }, "unknown case field: extra"],
    [
      { caseId: "", local: {}, localOutput: "", mode: "grade1", print: "" },
      "caseId must be a non-empty string",
    ],
    [
      { caseId: "x", local: null, localOutput: "", mode: "grade1", print: "" },
      "local must be a JSON object",
    ],
    [
      {
        caseId: "x",
        local: { kind: "rule", ruleId: "", unexpected: true },
        localOutput: "",
        mode: "grade1",
        print: "",
      },
      "unknown rule evidence field: unexpected",
    ],
    [
      {
        caseId: "x",
        local: { kind: "rule", ruleId: "" },
        localOutput: "",
        mode: "grade1",
        print: "",
      },
      "ruleId must be a non-empty string",
    ],
    [
      {
        caseId: "x",
        local: { kind: "test", testId: "" },
        localOutput: "",
        mode: "grade1",
        print: "",
      },
      "testId must be a non-empty string",
    ],
    [
      {
        caseId: "x",
        local: { kind: "corpus", testId: "x" },
        localOutput: "",
        mode: "grade1",
        print: "",
      },
      "local.kind must be rule or test",
    ],
    [
      {
        caseId: "x",
        local: { kind: "test", testId: "x" },
        localOutput: 1,
        mode: "grade1",
        print: "",
      },
      "localOutput must be a string",
    ],
    [
      {
        caseId: "x",
        local: { kind: "test", testId: "x" },
        localOutput: "",
        mode: "grade3",
        print: "",
      },
      "mode must be grade1, grade2, or technical",
    ],
    [
      {
        caseId: "x",
        local: { kind: "test", testId: "x" },
        localOutput: "",
        mode: "grade1",
        print: 1,
      },
      "print must be a string",
    ],
    [
      {
        caseId: "x",
        local: { kind: "test", testId: "x" },
        localOutput: "",
        mode: "grade1",
        print: "a\u0000b",
      },
      "print must not contain U+0000",
    ],
  ])("rejects malformed differential evidence", (value, message) => {
    expect(parseDifferentialCase(value)).toEqual({ error: message, ok: false });
  });

  it("rejects malformed JSON", () => {
    expect(parseDifferentialCaseLine("{")).toEqual({
      error: "case must be valid JSON",
      ok: false,
    });
  });
});

describe("compareOracleTranslation", () => {
  const case_ = {
    caseId: "case-1",
    local: { kind: "rule", ruleId: "ueb-2024:10.5.1" },
    localOutput: "⠯",
    mode: "grade2",
    print: "and",
  } as const;

  it("reports an agreement without promoting Liblouis to an authority", () => {
    expect(compareOracleTranslation(case_, oracle)).toEqual({
      evidence: {
        caseId: "case-1",
        input: "and",
        local: {
          kind: "rule",
          output: "⠯",
          ruleId: "ueb-2024:10.5.1",
        },
        oracle: {
          engine: "liblouis",
          output: "⠯",
          status:
            "non-normative development oracle; ICEB sources decide disagreements",
          tables: ["en-ueb-g2.ctb"],
          version: "3.38.0",
        },
      },
      kind: "agreement",
      ok: true,
    });
  });

  it("fails with both outputs and the local rule identifier", () => {
    expect(
      compareOracleTranslation(case_, { ...oracle, output: "⠁⠝⠙" }),
    ).toEqual({
      error: {
        code: "translation-disagreement",
        message:
          "case-1 disagrees at local rule ueb-2024:10.5.1; adjudicate against ICEB",
      },
      evidence: {
        caseId: "case-1",
        input: "and",
        local: {
          kind: "rule",
          output: "⠯",
          ruleId: "ueb-2024:10.5.1",
        },
        oracle: {
          engine: "liblouis",
          output: "⠁⠝⠙",
          status:
            "non-normative development oracle; ICEB sources decide disagreements",
          tables: ["en-ueb-g2.ctb"],
          version: "3.38.0",
        },
      },
      kind: "disagreement",
      ok: false,
    });
  });

  it("rejects a response correlated to another local case", () => {
    expect(() =>
      compareOracleTranslation(case_, { ...oracle, id: "another-case" }),
    ).toThrow("does not match");
  });
});
