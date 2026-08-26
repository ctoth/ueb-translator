import { describe, expect, it } from "vitest";

import {
  createManifest,
  parseManifest,
  stringifyManifest,
} from "../src/manifest.js";
import { buildDocumentRecord } from "../src/corpus.js";

describe("corpus manifest", () => {
  it("round-trips a versioned, immutable acquisition record", () => {
    const document = buildDocumentRecord({
      id: "wikinews:7",
      relativePath: "documents/7.txt",
      text: "News.\n",
    });
    const manifest = createManifest({
      documents: [document],
      source: {
        archiveSha1: "1".repeat(40),
        archiveUrl:
          "https://dumps.wikimedia.org/enwikinews/20260801/enwikinews-20260801-pages-articles.xml.bz2",
        kind: "wikinews",
        snapshot: "20260801",
      },
    });

    expect(parseManifest(stringifyManifest(manifest))).toEqual(manifest);
    expect(manifest).toMatchObject({
      extractionRulesVersion: 1,
      partition: {
        algorithm: "sha256-prefix-v1",
        heldOutPrefixes: "00-32",
        policy: "sealed-before-translation",
      },
      schemaVersion: 1,
      source: {
        attribution: "Wikinews contributors",
        kind: "wikinews",
        license:
          "Public domain, CC BY 2.5, or CC BY 4.0 according to publication date",
      },
    });
  });

  it("round-trips private EPUB and Gutenberg acquisition variants", () => {
    const documents = [
      {
        id: "held-out",
        partition: "held-out" as const,
        relativePath: "documents/0.txt",
        sha256: "0".repeat(64),
        utf8Bytes: 0,
      },
    ];
    const epub = createManifest({
      documents,
      source: {
        calibreVersion: "ebook-convert 9.3.1",
        kind: "epub",
        snapshot: "private-20260826",
      },
    });
    const gutenberg = createManifest({
      documents,
      source: {
        harvestUrl:
          "https://www.gutenberg.org/robot/harvest?filetypes[]=txt&langs[]=en",
        kind: "gutenberg",
        snapshot: "20260826",
      },
    });

    expect(parseManifest(stringifyManifest(epub))).toEqual(epub);
    expect(parseManifest(stringifyManifest(gutenberg))).toEqual(gutenberg);
  });

  it.each([
    ["null", "object"],
    ["[]", "object"],
    ["{}", "schemaVersion"],
    [
      JSON.stringify({ schemaVersion: 1, extractionRulesVersion: 2 }),
      "extractionRulesVersion",
    ],
    [
      JSON.stringify({
        documents: [],
        extractionRulesVersion: 1,
        partition: null,
        schemaVersion: 1,
      }),
      "partition must be an object",
    ],
    [
      JSON.stringify({
        documents: [],
        extractionRulesVersion: 1,
        partition: {
          algorithm: "random",
          heldOutPrefixes: "00-32",
          policy: "sealed-before-translation",
        },
        schemaVersion: 1,
        source: { kind: "epub", snapshot: "private" },
      }),
      "partition algorithm",
    ],
    [
      JSON.stringify({
        documents: [],
        extractionRulesVersion: 1,
        partition: {
          algorithm: "sha256-prefix-v1",
          heldOutPrefixes: "00-31",
          policy: "sealed-before-translation",
        },
        schemaVersion: 1,
      }),
      "heldOutPrefixes",
    ],
    [
      JSON.stringify({
        documents: [],
        extractionRulesVersion: 1,
        partition: {
          algorithm: "sha256-prefix-v1",
          heldOutPrefixes: "00-32",
          policy: "mutable",
        },
        schemaVersion: 1,
      }),
      "policy",
    ],
  ])("rejects an invalid manifest", (json, message) => {
    expect(() => parseManifest(json)).toThrow(message);
  });

  it.each([
    [{}, "documents must be an array"],
    [{ documents: [null], source: {} }, "documents[0] must be an object"],
    [
      {
        documents: [
          {
            id: "x",
            partition: "test",
            relativePath: "x",
            sha256: "0".repeat(64),
            utf8Bytes: 0,
          },
        ],
        source: {},
      },
      "partition is invalid",
    ],
    [
      {
        documents: [
          {
            id: 1,
            partition: "training",
            relativePath: "x",
            sha256: "0".repeat(64),
            utf8Bytes: 0,
          },
        ],
        source: {},
      },
      "id must be a string",
    ],
    [
      {
        documents: [
          {
            id: "x",
            partition: "training",
            relativePath: "x",
            sha256: "0".repeat(64),
            utf8Bytes: "0",
          },
        ],
        source: {},
      },
      "utf8Bytes must be a safe integer",
    ],
    [
      {
        documents: [
          {
            id: "x",
            partition: "training",
            relativePath: "x",
            sha256: "0".repeat(64),
            utf8Bytes: 1.5,
          },
        ],
        source: {},
      },
      "utf8Bytes must be a safe integer",
    ],
    [{ documents: [], source: null }, "source must be an object"],
    [{ documents: [], source: { kind: 1 } }, "kind must be a string"],
    [
      { documents: [], source: { kind: "epub", snapshot: 1 } },
      "snapshot must be a string",
    ],
    [
      { documents: [], source: { kind: "unknown", snapshot: "x" } },
      "kind is unsupported",
    ],
    [
      {
        documents: [],
        source: {
          calibreVersion: "9",
          kind: "epub",
          license: "wrong",
          snapshot: "x",
        },
      },
      "license",
    ],
  ])("rejects malformed manifest content", (partial, message) => {
    const json = JSON.stringify({
      extractionRulesVersion: 1,
      partition: {
        algorithm: "sha256-prefix-v1",
        heldOutPrefixes: "00-32",
        policy: "sealed-before-translation",
      },
      schemaVersion: 1,
      ...partial,
    });
    expect(() => parseManifest(json)).toThrow(message);
  });
});
