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
