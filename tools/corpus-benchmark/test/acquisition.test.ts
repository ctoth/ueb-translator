import { describe, expect, it } from "vitest";

import {
  gutenbergHarvestUrl,
  parseSha1Sums,
  wikinewsArchive,
} from "../src/acquisition.js";

describe("official corpus acquisition contracts", () => {
  it("uses Project Gutenberg's documented robot harvest path", () => {
    expect(gutenbergHarvestUrl()).toBe(
      "https://www.gutenberg.org/robot/harvest?filetypes[]=txt&langs[]=en",
    );
  });

  it("derives a Wikinews archive and checksum list from a dated snapshot", () => {
    expect(wikinewsArchive("20260801")).toEqual({
      archiveFile: "enwikinews-20260801-pages-articles.xml.bz2",
      archiveUrl:
        "https://dumps.wikimedia.org/enwikinews/20260801/enwikinews-20260801-pages-articles.xml.bz2",
      sha1SumsUrl:
        "https://dumps.wikimedia.org/enwikinews/20260801/enwikinews-20260801-sha1sums.txt",
    });
  });

  it("selects an exact archive digest from the official checksum document", () => {
    expect(
      parseSha1Sums(
        `${"a".repeat(40)}  other.bz2\n${"b".repeat(40)}  wanted.bz2\n`,
        "wanted.bz2",
      ),
    ).toBe("b".repeat(40));
  });

  it("rejects missing and malformed official checksums", () => {
    expect(() => parseSha1Sums("not-a-checksum wanted.bz2", "wanted.bz2")).toThrow(
      "does not contain",
    );
    expect(() =>
      parseSha1Sums(`${"z".repeat(40)}  wanted.bz2`, "wanted.bz2"),
    ).toThrow("does not contain");
    expect(() => wikinewsArchive("latest")).toThrow("YYYYMMDD");
  });
});
