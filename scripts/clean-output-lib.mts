import { rm } from "node:fs/promises";

export async function cleanOutputDirectory(outputDirectory: URL): Promise<void> {
  await rm(outputDirectory, { force: true, recursive: true });
}
