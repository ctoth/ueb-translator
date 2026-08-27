import { parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { findRepositoryRoot } from "../src/repository.js";

describe("findRepositoryRoot", () => {
  it("resolves the package from the module location instead of cwd", () => {
    expect(findRepositoryRoot(import.meta.url)).toBe(
      resolve(import.meta.dirname, "../../.."),
    );
  });

  it("fails at the filesystem boundary when no package root exists", () => {
    const filesystemRoot = parse(resolve(import.meta.dirname)).root;
    expect(() => findRepositoryRoot(pathToFileURL(filesystemRoot))).toThrow(
      "Could not locate the ueb-translator package root.",
    );
  });
});
