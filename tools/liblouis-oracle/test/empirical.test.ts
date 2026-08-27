import { describe, expect, it } from "vitest";

import {
  SCOWL_SOURCE,
  buildCorpusCases,
  buildDictionaryCases,
  divergenceFingerprint,
  parseScowlWordList,
  splitSentences,
} from "../src/empirical.js";

describe("empirical oracle inputs", () => {
  it("pins the exact SCOWL level-95 source and provenance", () => {
    expect(SCOWL_SOURCE).toEqual({
      archiveSha256:
        "5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc",
      archiveUrl:
        "https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz",
      gitCommit: "5ef55f9c42730ebe4394a78b77855468a6f15dd2",
      level: 95,
      version: "2020.12.07",
    });
  });

  it("parses a deterministic, duplicate-free SCOWL list without dropping shapes", () => {
    expect(parseScowlWordList("can't\nPowerPoint\ncafé\ncan't\n\n")).toEqual([
      "PowerPoint",
      "café",
      "can't",
    ]);
  });

  it("turns every non-empty corpus sentence into a stable digest-keyed case", () => {
    expect(splitSentences("First line!  Second line?\nThird line.\n\nFourth"))
      .toEqual(["First line!", "Second line?", "Third line.", "Fourth"]);

    const cases = buildCorpusCases({
      documentId: "gutenberg:1342",
      documentSha256: "a".repeat(64),
      text: "First line! Second line?",
    });
    expect(cases.map(({ caseId, print }) => ({ caseId, print }))).toEqual([
      {
        caseId: `corpus:${"a".repeat(64)}:00000000`,
        print: "First line!",
      },
      {
        caseId: `corpus:${"a".repeat(64)}:00000001`,
        print: "Second line?",
      },
    ]);
    expect(cases.every((case_) => case_.local.kind === "test")).toBe(true);
  });

  it("normalizes every CLI line separator before batching corpus cases", () => {
    expect(splitSentences("alpha\vbeta\fgamma\u0085delta\u2028epsilon\u2029zeta"))
      .toEqual(["alpha beta gamma delta epsilon zeta"]);
  });

  it("chunks retained long sentences below the Liblouis line limit", () => {
    const normalized = Array.from({ length: 400 }, () => "word").join(" ");
    const chunks = splitSentences(normalized);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 512)).toBe(true);
    expect(chunks.join(" ")).toBe(normalized);
  });

  it("builds the full dictionary channel with source-stable identifiers", () => {
    const cases = buildDictionaryCases(["about", "PowerPoint"]);
    expect(cases.map(({ caseId, print }) => ({ caseId, print }))).toEqual([
      { caseId: "scowl:2020.12.07:95:00000000", print: "about" },
      { caseId: "scowl:2020.12.07:95:00000001", print: "PowerPoint" },
    ]);
  });

  it("fingerprints the semantic divergence independently of seed and run order", () => {
    const evidence = {
      caseId: "fuzz:one",
      input: "1a",
      local: { kind: "test", output: "local", testId: "fuzz" },
      oracle: {
        engine: "liblouis",
        output: "oracle",
        status: "development oracle",
        tables: ["en-ueb-g2.ctb"],
        version: "3.38.0",
      },
    } as const;
    expect(divergenceFingerprint(evidence)).toMatch(/^[\da-f]{64}$/u);
    expect(divergenceFingerprint({ ...evidence, caseId: "fuzz:two" })).toBe(
      divergenceFingerprint(evidence),
    );
    expect(divergenceFingerprint({
      ...evidence,
      caseId: "fuzz:three",
      input: "bej",
      local: { ...evidence.local, output: "⠆⠚" },
      oracle: { ...evidence.oracle, output: "⠃⠑⠚" },
    })).toBe(divergenceFingerprint({
      ...evidence,
      input: "bea",
      local: { ...evidence.local, output: "⠆⠁" },
      oracle: { ...evidence.oracle, output: "⠃⠑⠁" },
    }));
  });
});
