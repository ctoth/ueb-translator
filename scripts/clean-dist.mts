import { rm } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);

await rm(outputDirectory, { force: true, recursive: true });
