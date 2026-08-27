import { cleanOutputDirectory } from "./clean-output-lib.mts";

const OUTPUT_DIRECTORIES = {
  corpus: new URL(
    "../node_modules/.cache/ueb-translator/corpus-benchmark/",
    import.meta.url,
  ),
  dist: new URL("../dist/", import.meta.url),
  oracle: new URL(
    "../node_modules/.cache/ueb-translator/liblouis-oracle/",
    import.meta.url,
  ),
} as const;

function outputDirectory(outputName: string | undefined): URL {
  switch (outputName) {
    case "corpus":
    case "dist":
    case "oracle":
      return OUTPUT_DIRECTORIES[outputName];
    default:
      throw new Error(
        `Build output must be one of: ${Object.keys(OUTPUT_DIRECTORIES).join(", ")}.`,
      );
  }
}

await cleanOutputDirectory(outputDirectory(process.argv[2]));
