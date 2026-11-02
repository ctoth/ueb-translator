# Authored rule data

JSON files own the rule values. Source interfaces and discriminated kinds remain
in their TypeScript family modules. `rule-json.ts` reads these shapes and expands
compact records into the existing compiler inputs. The symbol compiler owns the
Latin-to-digit derivation; the Latin Braille mapping is authored once.

| Family | JSON source | TypeScript source contract |
| --- | --- | --- |
| Symbols | `symbols/latin.json`, `modifiers.json`, `greek.json`, `general-symbols.json`, `special.json`, `vertical-bar.json` | `symbols/compiler.ts` |
| Modes | `modes/rules.json` | `modes/compiler.ts` |
| Composition policies | `policies/rules.json` | `policies/compiler.ts` |
| Contraction groups and citation locators | `grade2-rules.json`, `grade2-locators.json` | `Grade2RuleGroupSource`, `Grade2RuleSource`, `Grade2RuleLocatorByKind` |
| Shortforms | `shortforms.json` | `ShortformSource` |
| Appendix longer words | `appendix1.json` | `Appendix1GroupSource`, `Appendix1WordSource` |
| Contraction exceptions | `compound-exceptions.json`, `syllable-exceptions.json`, `syllable-vowel-words.json`, `initial-exceptions.json`, `final-exceptions.json` | `constraints.ts`, `WordFamilySource` |
| Initial elisions | `apostrophes.json` | `readonly string[]` |
| Technical descriptors | separate `technical-*.json` files | `technical-signs.ts`, `src/technical-program.ts` |
| Structural guard and longer-shortform membership | `structural-crossing.json`, `longer-shortforms.json` | `ContextualRuleGuard`, string set |
| Expected inventory counts | `inventory.json` | named numeric fields in `readInventory` |

Symbol and shortform tables contain print/cell pairs. Contraction groups contain
`kind`, `precedence`, `entries`, and `guards`; compilation derives stable IDs and
citations from their retained kind metadata. Appendix groups contain `base` and
`words`; compilation derives the per-word records. Exception word lists contain
literal strings or reviewed `{ "base": ..., "suffixes": [...] }` families.
Expansion includes the base and concatenates each listed suffix. This preserves
the previous finite spelling lists and does not infer unlisted morphology.

Technical mappings retain semantic print references into the shared symbol
inventory. Technical descriptors retain citation objects, ordering, raw pattern
strings and matching flags. Mode thresholds retain exact numeric values,
including the previous maximum-safe-integer sentinel.

The JSON guard reader preserves the full existing `ContextualRuleGuard` union,
including guards currently derived during compilation. It reuses the contextual
compiler's boundary inventory. The full guard union and its lowering remain in
TypeScript.

## Mechanical migration

`scripts/migrate-rule-json.mts` is a one-time extractor using the installed
TypeScript Compiler API. It prints proposed file contents for the editing tool;
it never writes source files. It recognizes the literal/helper constructions in
the pre-migration source and rejects unsupported forms. An optional Git reference
selects the original source; evaluated exports from the existing rules build
supply complete-record reference values. Compact tables and helper arguments are
extracted from the AST rather than transcribed. Compiler integration and decoding
are ordinary TypeScript code, with no new schema registry or build stage.

Both existing generators reproduce the same runtime and provenance artifacts.
The migration changes authoring ownership; the compiler port and generated
runtime format are separate later work.

## Retained source annotations

The extractor preserved these annotations from the migrated initializers.

### grade2-rules.ts

> Preserve the existing following-mode restriction for the be wordsign too.

> ICEB 10.6.3: retain the following mode boundary.

> ICEB 10.6.6: retain both adjacent mode boundaries.

### constraints.ts

> Before a vowel be is spelled by default (FIRST_SYLLABLE_VOWEL_WORDS).

### technical-signs.ts

> Preserve the implementation's ordered classifiers; these regexes are

> not asserted to be the wording of the cited indicator-count guidance.
