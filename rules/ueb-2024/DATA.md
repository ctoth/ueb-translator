# Authored rule data

JSON files own the rule values. Source interfaces and discriminated kinds remain
in their TypeScript family modules. `rule-json.ts` reads these shapes and expands
compact records into the existing compiler inputs. `sources.json` owns source
assembly and symbol-family expansion; the Latin Braille mapping is authored once.

The manifest's `documents` field selects the citation catalog and `authorities`
names each citing authority's official host (`citation-authorities.json`); both
compilers check every document's URL against its authority's host once, where the
catalog is loaded. Its `sources` tree
maps typed source fields to JSON filenames, including the nested `technical`
group. Python assembles this tree and decodes it into its existing attrs models.
TypeScript uses the same destinations through its checked family readers;
`source-files.ts` contains static JSON imports so the existing build can copy the
assets. Adding a new file requires registering its import there, while changing
the role or order of registered files only changes the manifest.

The ordered `symbols` array has three typed kinds:

- `rules` loads explicit symbol records from `file`.
- `pairs` gives a print/cell table a `symbolKind`, `citation`, `idPrefix`,
  `idKey` (`print` or `utf16-hex`) and explicit `uppercase` policy.
- `digits` pairs an explicit ordered `prints` list with the first corresponding
  cells of its input table, preserving the single Latin mapping.

`utf16-hex` retains the existing first UTF-16 code-unit ID convention. The one
locator placeholder, `{utf16Hex4}`, renders that value as uppercase hexadecimal
padded to four characters. These are finite table operations, not an expression
language. Both compilers use the descriptor order and produce the same expanded
records, full citations and provenance as before.

| Family | JSON source | TypeScript source contract |
| --- | --- | --- |
| Symbols | `symbols/latin.json`, `modifiers.json`, `greek.json`, `general-symbols.json`, `special.json`, `vertical-bar.json` | `symbols/compiler.ts` |
| Modes | `modes/rules.json` | `modes/compiler.ts` |
| Composition policies | `policies/rules.json` | `policies/compiler.ts` |
| Contraction groups and family defaults | `grade2-rules.json`, `grade2-families.json` | `Grade2RuleGroupSource`, `Grade2RuleSource`, `Grade2RuleFamilies` |
| Shortforms | `shortforms.json` | `ShortformSource` |
| Appendix longer words | `appendix1.json` | `Appendix1GroupSource`, `Appendix1WordSource` |
| Targeted constraints | `constraints.json` | `ConstraintSource`, `WordFamilySource`, existing contextual guards |
| Initial elisions | `apostrophes.json` | `readonly string[]` |
| Technical descriptors | separate `technical-*.json` files | `technical-signs.ts`, `src/technical-program.ts` |
| Longer-shortform guards and retained suffixes | `longer-shortforms.json`, `shortform-suffixes.json` | `ContextualRuleGuard`, checked word/suffix groups |
| Citation documents | `citation-documents.json`, `citation-authorities.json` | `RuleCitation`, retained family-specific citation types |
| Expected inventory counts | `inventory.json` | named numeric fields in `readInventory` |
| Contextual expansion policy | `expansion-policy.json` | `ExpansionPolicy`, precedence and guard unions |
| Grade 1 vocabulary and wire IDs | `grade1-vocabulary.json` | `Grade1Vocabulary`, mode/class name types, `CompositionPolicies` |

`grade1-vocabulary.json` declares `modes`, `classes` and `policies` as name-to-ID
maps. Mode IDs select runtime tuple positions; class IDs select mask bits; policy
IDs select provenance order. IDs must be integers forming a complete sequence
from zero. Property insertion order has no effect. Both compilers consume these
maps through the shared source manifest; no compiler owns a second order list.
TypeScript derives mode/class name types from the authored keys, while Python
retains its closed Literal types and checks complete key coverage. Named policy
output fields and the mode tuple layout remain the existing runtime contracts.

`expansion-policy.json` owns shortform and Appendix precedence/citations,
provenance ID components, collision and standing-literal kind membership, source
letter selection, and explicit plural/possessive suffix policy. IDs are opaque
provenance strings assembled from those declarations. Collision expansion caches
every spelling path for each shortform and indexes exclusions by the rules used;
source order does not choose one reading. Appendix substitution requires the base
to occur literally, and suffix exceptions look up the authored Appendix word.
Repeated literal ambiguities may coalesce only when their Braille output agrees.
`inventory.json` counts are enforced against actual contraction, contextual,
shortform and Appendix output rather than retained as unchecked metadata.

Symbol and shortform tables contain print/cell pairs, one pair per line. Contraction
families contain their citation locator and static guards. Groups contain `kind`,
`precedence`, `entries`, and additional `guards`; compilation derives stable IDs and
citations from family metadata. A group's optional `variants` append guards and
specify `idSuffix`, `locator` and `precedence`; the final ence preference exception
is authored this way. Family and group guards replace print-name conditionals;
finite exception joins and collision detection remain compiler algorithms.

Longer-shortform groups explicitly associate `words` with their guards. Suffix
policy has a `default` list and finite `exceptions` groups containing `words` and
`suffixes`. Neither policy infers behavior from particular shortform names.

Targeted constraints contain a citation, `target: { kind, print }`, and `guards`.
Targets must identify an existing authored contraction. Guard kinds are `not-word`,
`not-word-ending`, and `following-not-vowel-y-except-words`. Word guards explicitly
select `possessives: true` or `false`; `not-word` also declares ignored characters.
These source guards expand into the existing runtime guard types. One target join
replaces the former five exception-family readers and compiler dispatch. Constraint
and variant locators use the same closed pinpoint domain in both compilers.

Appendix groups contain `base` and
`words`; compilation derives the per-word records. Exception word lists contain
literal strings or reviewed `{ "base": ..., "suffixes": [...] }` families.
Expansion includes the base and concatenates each listed suffix. This preserves
the previous finite spelling lists and does not infer unlisted morphology.

Technical mappings retain semantic print references into the shared symbol
inventory. Technical descriptors retain pinpoint citations, ordering, raw pattern
strings and matching flags. Mode thresholds retain exact numeric values,
including the previous maximum-safe-integer sentinel.

Authored citations contain `{ "source": ..., "locator": ... }`. The source key
selects one of the six documents in `citation-documents.json`; checked readers
resolve full citation records before compilation. Constraint records identify their actual targets directly; they need no redundant
exception IDs. Expanded contextual IDs, full citations, runtime programs and
provenance remain the same. Ordered arrays retain their order, including when groups are split.

The JSON guard reader preserves the full existing `ContextualRuleGuard` union,
including guards currently derived during compilation. It reuses the contextual
compiler's boundary inventory. The full guard union and its lowering remain in
TypeScript.

## Mechanical migration

`scripts/migrate-rule-json.mts` is the historical one-time extractor for the
initial JSON migration, using the installed
TypeScript Compiler API. It prints proposed file contents for the editing tool;
it never writes source files. It recognizes the literal/helper constructions in
the pre-migration source and rejects unsupported forms. An optional Git reference
selects the original source; evaluated exports from the existing rules build
supply complete-record reference values. Compact tables and helper arguments are
extracted from the AST rather than transcribed. Its output describes that initial
format; the explicit policy/family/reference format above was simplified
afterwards. Compiler integration and decoding
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
