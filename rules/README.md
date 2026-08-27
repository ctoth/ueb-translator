# Rule intermediate representation

Normative UEB behavior is authored as ordinary, readable TypeScript data and compiled before publication. Each rule has four reviewable parts:

- a stable project-owned identifier;
- an exact input string;
- an exact Unicode Braille output string;
- a pinpoint citation naming ICEB or BANA, its document, locator, and official URL.

For example, the shape of an ICEB Rule 4.1 mapping is:

```ts
const example = {
  citation: {
    authority: "ICEB",
    document: "Rules of Unified English Braille, Third Edition",
    locator: "4.1",
    url: "https://iceb.org/publications/ueb/",
  },
  id: "iceb-ueb-4.1-letter-a",
  input: "a",
  output: "⠁",
};
```

The compiler rejects empty inputs, duplicate inputs, duplicate identifiers, and missing or unofficial citations. Its output separates tiny runtime arrays from development-only provenance. Rule files, citations, and compiler code are excluded from the npm artifact by the package allowlist.

`ueb-2024/symbols/` maps every supported print scalar to cells and a closed
character class. `ueb-2024/modes/` declares capitals, numeric, grade-1, and
typeform behavior using only indicators, member class, passage threshold,
termination classes, and continuation classes. Their compilers lower those
sources to the opaque tuples consumed by the browser runtime; UEB names and
classes remain in the development-only layer.

Run `npm run grade1:generate` after changing either package. The normal
`npm run check` gate begins with `grade1:generate:check`, which compiles into a
temporary directory and rejects any non-reproducible generated artifact.

Grade 2 compilation also derives its literal-letter ambiguity table and its
standing groupsign exclusions from the cited contraction outputs plus the
compiled Latin letter cells. `npm run grade2:generate` emits both beside the
contextual program; neither table is maintained by hand.
