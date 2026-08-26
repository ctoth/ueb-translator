import { createHash } from "node:crypto";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  assignPartition,
  buildDocumentRecord,
  verifyDocumentRecord,
} from "../src/corpus.js";
import {
  extractGutenbergBody,
  normalizeReadingText,
  readWikinewsPages,
} from "../src/text.js";

describe("sealed corpus partition", () => {
  it("uses a declared 51-of-256 SHA-256 prefix boundary", () => {
    expect(assignPartition(`00${"0".repeat(62)}`)).toBe("held-out");
    expect(assignPartition(`32${"0".repeat(62)}`)).toBe("held-out");
    expect(assignPartition(`33${"0".repeat(62)}`)).toBe("training");
    expect(assignPartition(`ff${"f".repeat(62)}`)).toBe("training");
  });

  it("is deterministic for every valid digest", () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 0, maxLength: 256 }), (bytes) => {
        const digest = createHash("sha256").update(bytes).digest("hex");
        expect(assignPartition(digest)).toBe(assignPartition(digest));
      }),
    );
    expect(() => assignPartition("NOT-A-DIGEST")).toThrow("SHA-256");
  });
});

describe("corpus document integrity", () => {
  it("records UTF-8 bytes, content hash, partition, and extraction version", () => {
    const record = buildDocumentRecord({
      id: "gutenberg:1342",
      relativePath: "documents/1342.txt",
      text: "Pride and Prejudice\n",
    });

    expect(record).toEqual({
      id: "gutenberg:1342",
      partition: assignPartition(record.sha256),
      relativePath: "documents/1342.txt",
      sha256: createHash("sha256")
        .update("Pride and Prejudice\n")
        .digest("hex"),
      utf8Bytes: 20,
    });
    expect(verifyDocumentRecord(record, "Pride and Prejudice\n")).toBe(true);
    expect(verifyDocumentRecord(record, "changed\n")).toBe(false);
    expect(
      verifyDocumentRecord(
        {
          ...record,
          partition: record.partition === "training" ? "held-out" : "training",
        },
        "Pride and Prejudice\n",
      ),
    ).toBe(false);
    expect(
      verifyDocumentRecord({ ...record, utf8Bytes: 21 }, "Pride and Prejudice\n"),
    ).toBe(false);
  });
});

describe("semantic reading-text extraction", () => {
  it("normalizes Unicode and layout whitespace without changing paragraphs", () => {
    expect(
      normalizeReadingText("  Cafe\u0301\u00a0  society\r\n\r\n Second\tline  "),
    ).toBe("Café society\n\nSecond line\n");
    expect(normalizeReadingText(" \r\n\t ")).toBe("");
  });

  it("uses Project Gutenberg's explicit start and end markers", () => {
    expect(
      extractGutenbergBody(
        "header\n*** START OF THE PROJECT GUTENBERG EBOOK X ***\nStory.\n*** END OF THE PROJECT GUTENBERG EBOOK X ***\nfooter",
      ),
    ).toBe("Story.\n");
    expect(extractGutenbergBody("Unmarked story.")).toBe("Unmarked story.\n");
    expect(
      extractGutenbergBody(
        "*** START OF THIS PROJECT GUTENBERG EBOOK X ***\nNo footer.",
      ),
    ).toBe("No footer.\n");
  });

  it("extracts main-namespace Wikinews article text and excludes redirects", () => {
    const xml = `<?xml version="1.0"?>
      <mediawiki>
        <page><title>News &amp; analysis</title><ns>0</ns><id>7</id>
          <revision><text xml:space="preserve">'''Lead''' with [[linked|reading]] text.&lt;ref&gt;source&lt;/ref&gt;</text></revision>
        </page>
        <page><title>Redirect</title><ns>0</ns><id>8</id><redirect title="Elsewhere" />
          <revision><text>#REDIRECT [[Elsewhere]]</text></revision>
        </page>
        <page><title>Template:Not prose</title><ns>10</ns><id>9</id>
          <revision><text>excluded</text></revision>
        </page>
      </mediawiki>`;

    expect(readWikinewsPages(xml)).toEqual([
      {
        id: "wikinews:7",
        text: "Lead with reading text.\n",
        title: "News & analysis",
      },
    ]);
  });

  it("normalizes supported XML and wikitext reading constructs", () => {
    const xml = `<mediawiki><page><title>&quot;A&apos;s &lt;B&gt;&quot;</title><ns>0</ns><id>1</id><revision><text>
      == Heading ==
      text &amp; more {{outer {{inner}}}} <!-- note --> <ref name="x" />
      [https://example.test label] [https://example.test] [[Target]]
      &lt;span&gt;visible&lt;/span&gt;
      [[Category:Hidden]]
      __NOTOC__
    </text></revision></page></mediawiki>`;
    expect(readWikinewsPages(xml)).toEqual([
      {
        id: "wikinews:1",
        text: "Heading\ntext & more\nlabel Target\nvisible\n",
        title: '"A\'s <B>"',
      },
    ]);
  });

  it.each([
    ["<page><title>x</title><id>1</id><revision><text>x</text></revision></page>"],
    ["<page><title>x</title><ns>0</ns><revision><text>x</text></revision></page>"],
    ["<page><ns>0</ns><id>1</id><revision><text>x</text></revision></page>"],
    ["<page><title>x</title><ns>0</ns><id>1</id><revision /></page>"],
    ["<page><title>x</title><ns>0</ns><id>1</id><revision><text> </text></revision></page>"],
  ])("excludes a non-article or empty page", (page) => {
    expect(readWikinewsPages(`<mediawiki>${page}</mediawiki>`)).toEqual([]);
  });
});
