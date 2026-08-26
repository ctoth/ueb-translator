import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(
  import.meta.dirname,
  "../../node_modules/.cache/ueb-translator/liblouis-oracle",
);

await rm(outputDirectory, { force: true, recursive: true });
