import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { ComparisonEvidence } from "../src/differential.js";
import { divergenceFingerprint } from "../src/empirical.js";
import {
  createFuzzTriage,
  divergenceHunks,
  fuzzFamilies,
  matchFuzzFamilies,
} from "../src/fuzz-families.js";

function evidence(input: string, local: string, oracle: string): ComparisonEvidence {
  return {
    caseId: `fuzz:${input}`,
    input,
    local: { kind: "test", output: local, testId: "fast-check:grade2-hard-shapes" },
    oracle: {
      engine: "liblouis", output: oracle, status: "development oracle",
      tables: ["en-ueb-g2.ctb"], version: "3.38.0",
    },
  };
}

interface LedgerRecord {
  readonly groupId: string;
  readonly input: string;
  readonly local: string;
  readonly oracle: string;
}

interface LedgerView {
  readonly kinds: ReadonlyMap<string, string>;
  readonly records: readonly LedgerRecord[];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function outputOf(value: unknown): string {
  if (!isRecord(value) || typeof value["output"] !== "string") {
    throw new Error("ledger evidence output must be a string");
  }
  return value["output"];
}

/** Full-evidence records with their verdict group; compact corpus repros are skipped. */
function readLedger(name: string): LedgerView {
  const raw: unknown = JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), "utf8"));
  if (!isRecord(raw) || !Array.isArray(raw["groups"]) || !Array.isArray(raw["disagreements"])) {
    throw new Error("ledger must have groups and disagreements");
  }
  const kinds = new Map<string, string>();
  for (const group of raw["groups"]) {
    if (!isRecord(group) || typeof group["id"] !== "string" ||
      !isRecord(group["verdict"]) || typeof group["verdict"]["kind"] !== "string") {
      throw new Error("ledger group must have an id and verdict kind");
    }
    kinds.set(group["id"], group["verdict"]["kind"]);
  }
  const records: LedgerRecord[] = [];
  for (const entry of raw["disagreements"]) {
    if (!isRecord(entry) || typeof entry["groupId"] !== "string") {
      throw new Error("ledger disagreement must reference a group");
    }
    if (typeof entry["input"] !== "string") continue;
    records.push({
      groupId: entry["groupId"], input: entry["input"],
      local: outputOf(entry["local"]), oracle: outputOf(entry["oracle"]),
    });
  }
  return { kinds, records };
}

describe("divergence hunks", () => {
  it("splits independent differences so each can be judged separately", () => {
    expect(divergenceHunks("⠆⠆⠵⠧⠛⠣⠏", "⠃⠑⠆⠵⠧⠶⠓⠏")).toEqual([
      { local: "⠆", oracle: "⠃⠑" },
      { local: "⠛⠣", oracle: "⠶⠓" },
    ]);
  });

  it("reports nothing for identical outputs", () => {
    expect(divergenceHunks("⠁⠃", "⠁⠃")).toEqual([]);
  });
});

describe("fuzz divergence families", () => {
  it.each([
    ["[befcjzmiu'", "⠨⠣⠆⠋⠉⠚⠵⠍⠊⠥⠄", "⠨⠣⠃⠑⠋⠉⠚⠵⠍⠊⠥⠄", ["fuzz-sep19-first-syllable"]],
    ["\"berlsisbcm:", "⠦⠆⠗⠇⠎⠊⠎⠃⠉⠍⠒", "⠦⠃⠻⠇⠎⠊⠎⠃⠉⠍⠒", ["fuzz-sep19-first-syllable"]],
    ["\"bedlcryigbj.", "⠦⠆⠙⠇⠉⠗⠽⠊⠛⠃⠚⠲", "⠦⠃⠫⠇⠉⠗⠽⠊⠛⠃⠚⠲", ["fuzz-sep19-first-syllable"]],
    ["(discjhbu'", "⠐⠣⠲⠉⠚⠓⠃⠥⠄", "⠐⠣⠙⠊⠎⠉⠚⠓⠃⠥⠄", ["fuzz-sep19-first-syllable"]],
    ["{uqgghjgpycuo;", "⠸⠣⠥⠟⠛⠣⠚⠛⠏⠽⠉⠥⠕⠆", "⠸⠣⠥⠟⠶⠓⠚⠛⠏⠽⠉⠥⠕⠆", ["fuzz-unknown-gh-pronunciation"]],
    ["\"aggha)", "⠦⠁⠛⠣⠁⠐⠜", "⠦⠁⠶⠓⠁⠐⠜", ["fuzz-unknown-gh-pronunciation"]],
    ["[ar!", "⠨⠣⠜⠖", "⠨⠣⠁⠗⠖", ["fuzz-unexpanded-ar-gh"]],
    ["(gh:", "⠐⠣⠣⠒", "⠐⠣⠛⠓⠒", ["fuzz-unexpanded-ar-gh"]],
    ["bebbzvgghp", "⠆⠆⠵⠧⠛⠣⠏", "⠃⠑⠆⠵⠧⠶⠓⠏",
      ["fuzz-sep19-first-syllable", "fuzz-unknown-gh-pronunciation"]],
    ["fstcvw'lb", "⠋⠎⠞⠉⠧⠺⠄⠇⠃", "⠋⠌⠉⠧⠺⠄⠇⠃", ["reviewed-fuzz-49135499c92932b3"]],
    ["ehpwqi-fstbv", "⠑⠓⠏⠺⠟⠊⠤⠋⠎⠞⠃⠧", "⠑⠓⠏⠺⠟⠊⠤⠋⠌⠃⠧", ["reviewed-fuzz-49135499c92932b3"]],
    ["fsthxbev", "⠋⠎⠹⠭⠃⠑⠧", "⠋⠌⠓⠭⠃⠑⠧", ["reviewed-fuzz-49135499c92932b3"]],
    ["'ing}", "⠄⠔⠛⠸⠜", "⠄⠬⠸⠜", ["fuzz-sep19-initial-ing"]],
    ["(ingvtttfzzbs:", "⠐⠣⠔⠛⠧⠞⠞⠞⠋⠵⠵⠃⠎⠒", "⠐⠣⠬⠧⠞⠞⠞⠋⠵⠵⠃⠎⠒", ["fuzz-sep19-initial-ing"]],
  ])("recognizes %s as an already-judged type", (input, local, oracle, groups) => {
    expect(matchFuzzFamilies(evidence(input, local, oracle))).toEqual(groups);
  });

  it.each([
    ["bea", "⠆⠁", "⠃⠑⠁", "be before a vowel is not a first-syllable choice (#100)"],
    ["{bee.", "⠸⠣⠆⠑⠲", "⠸⠣⠃⠑⠑⠲", "one-syllable bee is judged separately (#100)"],
    ["a-beaa", "⠁⠤⠆⠁⠁", "⠁⠤⠃⠂⠁", "be before a vowel (#100)"],
    ["\"beemnzkkmg'", "⠦⠆⠑⠍⠝⠵⠅⠅⠍⠛⠄", "⠦⠃⠑⠑⠍⠝⠵⠅⠅⠍⠛⠄", "be before a vowel (#100)"],
    ["benced", "⠆⠝⠉⠫", "⠃⠰⠑⠙", "10.10.6 requires ence (#94)"],
    ["thenced", "⠮⠝⠉⠫", "⠹⠰⠑⠙", "10.10.6 requires ence (#94)"],
    ["conamehmchz", "⠒⠁⠍⠑⠓⠍⠡⠵", "⠉⠕⠐⠝⠓⠍⠡⠵", "con before a vowel"],
    ["Befcj", "⠠⠆⠋⠉⠚", "⠠⠃⠑⠋⠉⠚", "capitals rules are out of scope"],
    ["xbefc", "⠭⠆⠋⠉", "⠭⠃⠑⠋⠉", "be is not at the beginning of a word"],
    ["(ars)", "⠐⠣⠜⠎⠐⠜", "⠐⠣⠁⠗⠎⠐⠜", "ar is not standing alone"],
    [":befc", "⠒⠆⠋⠉", "⠒⠃⠑⠋⠉", "a colon does not begin a word (2.6.2)"],
    ["fsta", "⠋⠎⠞⠁", "⠋⠌⠁", "first is not read before a vowel (10.9.3)"],
    ["fsty", "⠋⠎⠞⠽", "⠋⠌⠽", "first is not read before y (10.9.3)"],
    ["xfstb", "⠭⠋⠎⠞⠃", "⠭⠋⠌⠃", "fst is not at the beginning of a word"],
    ["xing ingb", "⠭⠔⠛ ⠔⠛⠃", "⠭⠬ ⠬⠃", "a medial ing is outside the family"],
  ])("leaves %s for adjudication: %s", (input, local, oracle) => {
    expect(matchFuzzFamilies(evidence(input, local, oracle))).toBeUndefined();
  });

  it("requires every hunk to belong to a family", () => {
    expect(matchFuzzFamilies(evidence("befc thenced", "⠆⠋⠉ ⠮⠝⠉⠫", "⠃⠑⠋⠉ ⠹⠰⠑⠙")))
      .toBeUndefined();
  });

  it("treats a divergence as triaged by exact fingerprint or by family", () => {
    const listed = evidence("x", "⠁", "⠃");
    const triaged = createFuzzTriage(new Set([divergenceFingerprint(listed)]));
    expect(triaged(listed)).toBe(true);
    expect(triaged(evidence("[ar!", "⠨⠣⠜⠖", "⠨⠣⠁⠗⠖"))).toBe(true);
    expect(triaged(evidence("bea", "⠆⠁", "⠃⠑⠁"))).toBe(false);
  });
});

describe("family consistency with the adjudicated ledger", () => {
  const { kinds, records } = readLedger("empirical-disagreements.json");
  const groupsOf = (record: LedgerRecord): readonly string[] =>
    matchFuzzFamilies(evidence(record.input, record.local, record.oracle)) ?? [];

  it("extends existing verdict groups only", () => {
    for (const family of fuzzFamilies) {
      expect(kinds.has(family.groupId), family.id).toBe(true);
    }
  });

  it("matches recorded members of every family's group", () => {
    for (const family of fuzzFamilies) {
      const members = records.filter((record) =>
        record.groupId === family.groupId && groupsOf(record).includes(family.groupId)
      );
      expect(members.length, family.id).toBeGreaterThan(0);
    }
  });

  it("never assigns a recorded divergence a verdict different from its own", () => {
    const conflicts = records.flatMap((record) =>
      groupsOf(record)
        .filter((group) => kinds.get(group) !== kinds.get(record.groupId))
        .map((group) => `${JSON.stringify(record.input)} ${record.groupId} -> ${group}`)
    );
    expect(conflicts).toEqual([]);
  });
});
