# ueb-translator

A tiny, browser-first, standards-driven Unified English Braille translator in
strict TypeScript.

This repository is under active construction. Its first deliberately narrow API
translates Basic Latin letters, ASCII digits, spaces, and line boundaries. It
returns a typed failure for every character whose complete controlling rules are
not implemented yet.

```ts
import { translateBasicGrade1 } from "ueb-translator";

const result = translateBasicGrade1("NASA 7a");
if (result.ok) {
  console.log(result.braille); // ⠠⠠⠝⠁⠎⠁⠀⠼⠛⠰⠁
}
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

The [compiler architecture](https://github.com/ctoth/ueb-translator/blob/main/docs/ARCHITECTURE.md) documents the selected finite-state algorithms, source-rule provenance, and package boundary. Run `npm run size` for a reproducible raw, minified, gzip, and Brotli byte report.

## Status

The first milestone establishes strict compilation, provenance rules, and the
Unicode braille-cell primitive on which the translator will be built.

## License

MIT
