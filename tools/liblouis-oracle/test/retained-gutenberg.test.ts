import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

describe("retained Gutenberg corpus", () => {
  it("expands to the pinned ebook 1342 bytes", () => {
    const compressed = readFileSync(resolve(
      "tools/liblouis-oracle/fixtures/gutenberg-1342.txt.gz",
    ));
    const digest = createHash("sha256").update(gunzipSync(compressed)).digest("hex");

    expect(digest)
      .toBe("74f2665d6e6925fc2c17dec644bec9e87df478a0f1836822125e8acbb3777806");
  });
});
