import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

describe("breaking public-surface release metadata", () => {
  it("identifies the public 2.0.0 package and its canonical repository", () => {
    const parsed: unknown = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
    );
    expect(isRecord(parsed)).toBe(true);
    if (!isRecord(parsed)) {
      return;
    }

    expect(parsed["name"]).toBe("ueb-translator");
    expect(parsed["version"]).toBe("2.0.0");
    expect(parsed["license"]).toBe("MIT");
    expect(parsed["homepage"]).toBe(
      "https://github.com/ctoth/ueb-translator#readme",
    );
    expect(parsed["repository"]).toEqual({
      type: "git",
      url: "git+https://github.com/ctoth/ueb-translator.git",
    });
    expect(parsed["bugs"]).toEqual({
      url: "https://github.com/ctoth/ueb-translator/issues",
    });
    expect(parsed["publishConfig"]).toEqual({ access: "public" });
    expect(parsed["engines"]).toEqual({ node: ">=22.18.0" });
  });
});
