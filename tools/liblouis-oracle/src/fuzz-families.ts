import type { ComparisonEvidence } from "./differential.js";
import { divergenceFingerprint } from "./empirical.js";

/** One contiguous difference between the local and oracle braille. */
export interface DivergenceHunk {
  readonly local: string;
  readonly oracle: string;
}

/**
 * A rule-level description of an already-adjudicated divergence type.
 * A family never carries its own verdict: it extends the named ledger group,
 * whose ICEB rationale covers every generated string the predicate accepts.
 */
export interface DivergenceFamily {
  readonly groupId: string;
  readonly id: string;
  matches(hunk: DivergenceHunk, input: string): boolean;
}

type FamilyEvidence = Pick<ComparisonEvidence, "input" | "local" | "oracle">;

/**
 * Split two outputs into the differing runs between their longest common
 * subsequence. Braille cells are single UTF-16 units, so cells are indexed
 * directly as in divergenceFingerprint.
 */
export function divergenceHunks(local: string, oracle: string): readonly DivergenceHunk[] {
  const lengths = Array.from(
    { length: local.length + 1 },
    () => new Array<number>(oracle.length + 1).fill(0),
  );
  for (let i = 1; i <= local.length; i += 1) {
    for (let j = 1; j <= oracle.length; j += 1) {
      const row = lengths[i] ?? [];
      row[j] = local.charAt(i - 1) === oracle.charAt(j - 1)
        ? (lengths[i - 1]?.[j - 1] ?? 0) + 1
        : Math.max(lengths[i - 1]?.[j] ?? 0, row[j - 1] ?? 0);
    }
  }
  // Backtrack from the end so each match is taken as late as possible. On a
  // tie the local cell is consumed first, which keeps a sign such as ⠣ from
  // matching the identical second cell of a preceding parenthesis.
  const hunks: DivergenceHunk[] = [];
  let pendingLocal = "";
  let pendingOracle = "";
  const flush = (): void => {
    if (pendingLocal !== "" || pendingOracle !== "") {
      hunks.unshift({ local: pendingLocal, oracle: pendingOracle });
      pendingLocal = "";
      pendingOracle = "";
    }
  };
  let i = local.length;
  let j = oracle.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && local.charAt(i - 1) === oracle.charAt(j - 1)) {
      flush();
      i -= 1;
      j -= 1;
    } else if (i > 0 && (j === 0 || (lengths[i - 1]?.[j] ?? 0) >= (lengths[i]?.[j - 1] ?? 0))) {
      pendingLocal = `${local.charAt(i - 1)}${pendingLocal}`;
      i -= 1;
    } else {
      pendingOracle = `${oracle.charAt(j - 1)}${pendingOracle}`;
      j -= 1;
    }
  }
  flush();
  return hunks;
}

const consonant = /^[bcdfghjklmnpqrstvwxz]$/u;
const letterCells: Readonly<Record<string, string>> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", g: "⠛", h: "⠓", i: "⠊", n: "⠝", o: "⠕",
  r: "⠗", s: "⠎",
};
/** Groupsigns the oracle may form from the prefix's final e and the next letter. */
const eGroupsigns: Readonly<Record<string, string>> = { d: "⠫", n: "⠢", r: "⠻" };

function spelled(letters: string): string {
  let cells = "";
  for (let index = 0; index < letters.length; index += 1) {
    const cell = letterCells[letters.charAt(index)];
    if (cell === undefined) {
      throw new Error(`No braille cell recorded for ${letters.charAt(index)}`);
    }
    cells += cell;
  }
  return cells;
}

/**
 * A word begins after a space, hyphen or dash, possibly preceded by opening
 * punctuation (ICEB 2.6.2). The sets mirror the UEB-policy-standing-boundaries
 * and UEB-policy-opening-standing-punctuation rule sources.
 */
function isWordStart(input: string, index: number): boolean {
  return /(?:^|[\s\-–—])[([{“‘’"'«]*$/u.test(input.slice(0, index));
}

function wordInitialOccurrences(input: string, prefix: string): readonly number[] {
  const indexes: number[] = [];
  for (let index = input.indexOf(prefix); index >= 0; index = input.indexOf(prefix, index + 1)) {
    if (isWordStart(input, index)) {
      indexes.push(index);
    }
  }
  return indexes;
}

function firstSyllableSign(prefix: string, cell: string): DivergenceFamily["matches"] {
  return (hunk, input) => {
    if (!hunk.local.startsWith(cell)) {
      return false;
    }
    const occurrences = wordInitialOccurrences(input, prefix);
    // Unknown syllabification only: a vowel after the prefix may make it a
    // one-syllable word such as bee or bea, which is adjudicated separately.
    if (occurrences.length === 0 || !occurrences.every((index) =>
      consonant.test(input.charAt(index + prefix.length))
    )) {
      return false;
    }
    const rest = hunk.local.slice(cell.length);
    if (hunk.oracle === `${spelled(prefix)}${rest}`) {
      return true;
    }
    // be followed by r, d or n: the oracle spells b and writes er, ed or en.
    return prefix === "be" && Object.entries(eGroupsigns).some(([letter, sign]) =>
      rest.startsWith(spelled(letter)) &&
      hunk.oracle === `⠃${sign}${rest.slice(1)}`
    );
  };
}

function standaloneGroupsign(letters: string, cell: string): DivergenceFamily["matches"] {
  return (hunk, input) =>
    hunk.local === cell && hunk.oracle === spelled(letters) &&
    input.split(/[^a-z]+/u).includes(letters);
}

/** Every occurrence of the letters begins a word, and there is at least one. */
function onlyWordInitial(input: string, letters: string): boolean {
  const occurrences = wordInitialOccurrences(input, letters);
  return occurrences.length > 0 && occurrences.length === input.split(letters).length - 1;
}

/**
 * 10.9.3(c) permits the shortform first at the beginning of a longer word
 * before a consonant other than y, so 10.9.6 requires spelling the st that
 * would make f+st read as first. The oracle writes st (or st+h before th).
 */
function firstShortformCollision(hunk: DivergenceHunk, input: string): boolean {
  return (
    (hunk.local === "⠎⠞" && hunk.oracle === "⠌") ||
    (hunk.local === "⠎⠹" && hunk.oracle === "⠌⠓")
  ) && onlyWordInitial(input, "fst") &&
    wordInitialOccurrences(input, "fst").every((index) => consonant.test(input.charAt(index + 3)));
}

export const fuzzFamilies: readonly DivergenceFamily[] = [
  { groupId: "fuzz-sep19-first-syllable", id: "first-syllable-be", matches: firstSyllableSign("be", "⠆") },
  { groupId: "fuzz-sep19-first-syllable", id: "first-syllable-con", matches: firstSyllableSign("con", "⠒") },
  { groupId: "fuzz-sep19-first-syllable", id: "first-syllable-dis", matches: firstSyllableSign("dis", "⠲") },
  {
    groupId: "fuzz-unknown-gh-pronunciation",
    id: "gh-before-gg",
    matches: (hunk, input) => hunk.local === "⠛⠣" && hunk.oracle === "⠶⠓" && input.includes("ggh"),
  },
  { groupId: "fuzz-unexpanded-ar-gh", id: "standalone-ar", matches: standaloneGroupsign("ar", "⠜") },
  { groupId: "fuzz-unexpanded-ar-gh", id: "standalone-gh", matches: standaloneGroupsign("gh", "⠣") },
  { groupId: "reviewed-fuzz-49135499c92932b3", id: "first-shortform-collision", matches: firstShortformCollision },
  {
    // 10.4.3 forbids ing at the beginning of a word; the oracle uses it there.
    groupId: "fuzz-sep19-initial-ing",
    id: "initial-ing",
    matches: (hunk, input) => hunk.local === "⠔⠛" && hunk.oracle === "⠬" && onlyWordInitial(input, "ing"),
  },
];

/**
 * Return the ledger groups whose families cover every difference, or undefined
 * when any difference is outside the families. Families cover lowercase
 * generated strings only; capitals rules and 10.10.6 "ence" sequences (#94)
 * always go to adjudication.
 */
export function matchFuzzFamilies(evidence: FamilyEvidence): readonly string[] | undefined {
  const { input } = evidence;
  if (/[A-Z]/u.test(input) || /ence[adr]/u.test(input)) {
    return undefined;
  }
  const hunks = divergenceHunks(evidence.local.output, evidence.oracle.output);
  const groups: string[] = [];
  for (const hunk of hunks) {
    const family = fuzzFamilies.find((candidate) => candidate.matches(hunk, input));
    if (family === undefined) {
      return undefined;
    }
    if (!groups.includes(family.groupId)) {
      groups.push(family.groupId);
    }
  }
  return groups.length === 0 ? undefined : groups;
}

/** A divergence is triaged when its exact fingerprint is ledgered or families cover it. */
export function createFuzzTriage(
  knownFingerprints: ReadonlySet<string>,
): (evidence: ComparisonEvidence) => boolean {
  return (evidence) =>
    knownFingerprints.has(divergenceFingerprint(evidence)) ||
    matchFuzzFamilies(evidence) !== undefined;
}
