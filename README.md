# ueb-translator

A tiny, browser-first, standards-driven Unified English Braille translator in
strict TypeScript.

This repository is under active construction. Its uncontracted API translates
the deterministic print surface of UEB grade 1 and returns a typed failure for
unsupported input instead of guessing.

```ts
import { translateGrade1 } from "ueb-translator";

const result = translateGrade1("NASA 7a");
if (result.ok) {
  console.log(result.braille); // ⠠⠠⠝⠁⠎⠁⠀⠼⠛⠰⠁
}
```

Plain strings preserve ASCII spaces, LF, CRLF, and paragraph text exactly.
Tabs, unsupported characters, and distinctions that print does not encode are
reported rather than inferred. Semantic typeforms and Braille grouping use a
typed document:

```ts
import { translateGrade1, type Grade1Document } from "ueb-translator";

const document = {
  kind: "grade1-document",
  paragraphs: [{
    runs: [
      { text: "important", typeforms: ["italic"] },
      { text: " " },
      { kind: "braille-group", runs: [{ text: "grouped" }] },
    ],
  }],
} satisfies Grade1Document;

const result = translateGrade1(document);
```

Contracted literary UEB is a separate, tree-shakeable entry point:

```ts
import { translateGrade2 } from "ueb-translator/grade2";

const result = translateGrade2("You should receive your letter.");
```

Rule traces are intentionally separate from the ordinary browser path and are
available from `ueb-translator/grade2/diagnostics` for conformance work.

Backtranslation is a separate browser entry point and never guesses between
standards-valid print candidates:

```ts
import {
  backtranslateGrade2,
  selectBacktranslation,
} from "ueb-translator/backtranslation";

const decoded = backtranslateGrade2("⠁⠃");
if (decoded.kind === "ambiguous") {
  // Both `ab` and the UEB shortform `about` canonically produce these cells.
  console.log(decoded.candidates.size); // 2n
  console.log(Array.from(decoded.candidates, ({ print }) => print));
}

// Optional dictionary or product policy is explicitly caller-owned.
const selected = selectBacktranslation(decoded, (candidates) =>
  candidates.find(({ print }) => print === "about")
);
```

The default decoder contains no dictionary, frequency corpus, language model,
or Liblouis code. Grade 2 candidates include the same generated ICEB rule IDs
used by forward diagnostics. See the
[backtranslation contract](https://github.com/ctoth/ueb-translator/blob/main/docs/BACKTRANSLATION.md)
for ambiguity, normalization, failure offsets, and algorithm details.

Technical UEB is also a separate browser entry point. Plain text preserves the
print symbols actually supplied; stacked fractions, scripts, radicals,
matrices, chemistry, and significant computer layout use explicit structure:

```ts
import {
  translateTechnical,
  type TechnicalDocument,
} from "ueb-translator/technical";

const document = {
  kind: "technical-document",
  profile: {
    grade1: "preferred",
    jurisdiction: "international",
    operationSpacing: "unspaced",
  },
  blocks: [{
    kind: "expression",
    expression: {
      kind: "general-fraction",
      numerator: { kind: "identifier", value: "x" },
      denominator: { kind: "number", value: "2" },
    },
  }],
} satisfies TechnicalDocument;

const result = translateTechnical(document);
```

The [technical contract](https://github.com/ctoth/ueb-translator/blob/main/docs/TECHNICAL.md)
lists the closed variants, regional policies, official source precedence, and
the boundary where raw strings must not be treated as a visual notation tree.

## Design constraints

- UEB only: uncontracted (grade 1), contracted (grade 2), and technical UEB.
- The definitive specification is ICEB's *Rules of Unified English Braille*,
  Third Edition (2024), plus subsequently approved official updates.
- Implementation rules, tests, and generated data come only from official
  braille-authority sources.
- Liblouis is an optional black-box conformance oracle. Its code, tables,
  generated output, and tests are not incorporated into the package.
- Zero runtime dependencies and browser-native ECMAScript modules.
- Package size, minified size, and compressed size are measured, not guessed.
- Property tests use `fast-check` only as a development dependency; generated
  cases are reproducible and shrink failing inputs without entering the package.

The [compiler architecture](https://github.com/ctoth/ueb-translator/blob/main/docs/ARCHITECTURE.md) documents the selected finite-state algorithms, source-rule provenance, and package boundary. Run `npm run size` for a reproducible raw, minified, gzip, and Brotli byte report.
The [uncontracted contract](https://github.com/ctoth/ueb-translator/blob/main/docs/GRADE1.md)
lists the Grade 1 surface, explicit semantic nodes, and failure boundary.

The legacy `translateBasicGrade1` entry point remains available while the full
library is under construction.

## License

MIT
