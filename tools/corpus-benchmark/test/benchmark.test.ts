import { describe, expect, it } from "vitest";

import { benchmarkDocuments } from "../src/benchmark.js";
import { buildDocumentRecord } from "../src/corpus.js";

describe("benchmarkDocuments", () => {
  it("reports bytes, cells, throughput, unsupported inputs, and peak memory", () => {
    const accepted = buildDocumentRecord({
      id: "accepted",
      relativePath: "documents/accepted.txt",
      text: "and\n",
    });
    const rejected = buildDocumentRecord({
      id: "rejected",
      relativePath: "documents/rejected.txt",
      text: "x\n",
    });
    const texts = new Map([
      ["accepted", "and\n"],
      ["rejected", "x\n"],
    ]);
    let clock = 100;

    const result = benchmarkDocuments({
      clock: () => {
        clock += 500;
        return clock;
      },
      documents: [accepted, rejected],
      memoryUsage: () => ({ heapUsed: 200, rss: 300 }),
      readText: (record) => texts.get(record.id) ?? "",
      translate: (text) =>
        text.startsWith("and")
          ? { braille: "⠯⠐", ok: true }
          : { ok: false, reason: "unsupported-character" },
    });

    expect(result).toEqual({
      documents: 2,
      elapsedSeconds: 0.5,
      inputUtf8Bytes: 6,
      outputCells: 2,
      peakHeapBytes: 200,
      peakRssBytes: 300,
      throughputUtf8BytesPerSecond: 12,
      translatedDocuments: 1,
      unsupportedDocuments: 1,
    });
  });

  it("defines empty instantaneous throughput as zero", () => {
    expect(
      benchmarkDocuments({
        clock: () => 10,
        documents: [],
        memoryUsage: () => ({ heapUsed: 0, rss: 0 }),
        readText: () => "",
        translate: () => ({ braille: "", ok: true }),
      }),
    ).toEqual({
      documents: 0,
      elapsedSeconds: 0,
      inputUtf8Bytes: 0,
      outputCells: 0,
      peakHeapBytes: 0,
      peakRssBytes: 0,
      throughputUtf8BytesPerSecond: 0,
      translatedDocuments: 0,
      unsupportedDocuments: 0,
    });
  });
});
