import { describe, expect, it } from "vitest";

import {
  translateGrade1,
  translateUeb,
  type Grade1Document,
  type TechnicalInput,
  type UebTranslationRequest,
} from "../src/index.js";

describe("combined UEB translation API", () => {
  it("accepts a Grade 1 input union through the intentional overload", () => {
    const translate = (input: Grade1Document | string) => translateGrade1(input);

    expect(translate("A")).toEqual({
      braille: "⠠⠁",
      mode: "grade1",
      ok: true,
    });
  });

  it.each([
    {
      expected: { braille: "⠠⠁", mode: "grade1", ok: true },
      request: { input: "A", mode: "grade1" },
    },
    {
      expected: { braille: "⠯", mode: "grade2", ok: true },
      request: { input: "and", mode: "grade2" },
    },
    {
      expected: { braille: "⠠⠁", mode: "grade1", ok: true },
      request: {
        input: {
          kind: "grade1-document",
          paragraphs: [{ runs: [{ text: "A" }] }],
        },
        mode: "grade1",
      },
    },
    {
      expected: { braille: "⠯", mode: "grade2", ok: true },
      request: {
        input: {
          kind: "grade2-document",
          runs: [{ kind: "text", text: "and" }],
        },
        mode: "grade2",
      },
    },
    {
      expected: {
        braille: "⠼⠉⠐⠖⠼⠃⠐⠶⠼⠑",
        mode: "technical-text",
        ok: true,
      },
      request: {
        input: { kind: "technical-text", text: "3+2=5" },
        mode: "technical",
      },
    },
  ] satisfies readonly {
    readonly expected: Readonly<Record<string, unknown>>;
    readonly request: UebTranslationRequest;
  }[])("dispatches $request.mode without guessing its input", ({ expected, request }) => {
    expect(translateUeb(request)).toEqual(expected);
  });

  it("accepts a structured technical document as the other technical-input variant", () => {
    const input = {
      blocks: [
        {
          expression: { kind: "identifier", value: "x" },
          kind: "expression",
        },
      ],
      kind: "technical-document",
      profile: {
        grade1: "preferred",
        jurisdiction: "international",
        operationSpacing: "unspaced",
      },
    } satisfies TechnicalInput;

    expect(translateUeb({ input, mode: "technical" })).toEqual({
      braille: "⠰⠭",
      mode: "technical",
      ok: true,
    });
  });
});
