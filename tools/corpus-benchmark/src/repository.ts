import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function findRepositoryRoot(moduleUrl: string | URL): string {
  let directory = fileURLToPath(new URL(".", moduleUrl));
  let previousDirectory = "";
  while (directory !== previousDirectory) {
    try {
      const parsed: unknown = JSON.parse(
        readFileSync(resolve(directory, "package.json"), "utf8"),
      );
      if (isRecord(parsed) && parsed["name"] === "ueb-translator") {
        return directory;
      }
    } catch {
      // Keep walking when this directory is not the package root.
    }

    previousDirectory = directory;
    directory = dirname(directory);
  }
  throw new Error("Could not locate the ueb-translator package root.");
}
