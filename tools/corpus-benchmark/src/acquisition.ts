export interface WikinewsArchive {
  readonly archiveFile: string;
  readonly archiveUrl: string;
  readonly sha1SumsUrl: string;
}

const GUTENBERG_HARVEST_URL =
  "https://www.gutenberg.org/robot/harvest?filetypes[]=txt&langs[]=en";

export function gutenbergHarvestUrl(): string {
  return GUTENBERG_HARVEST_URL;
}

export function wikinewsArchive(snapshot: string): WikinewsArchive {
  if (!/^\d{8}$/u.test(snapshot)) {
    throw new Error("Wikinews acquisition requires a YYYYMMDD snapshot.");
  }
  const prefix = `https://dumps.wikimedia.org/enwikinews/${snapshot}`;
  const archiveFile = `enwikinews-${snapshot}-pages-articles.xml.bz2`;
  return {
    archiveFile,
    archiveUrl: `${prefix}/${archiveFile}`,
    sha1SumsUrl: `${prefix}/enwikinews-${snapshot}-sha1sums.txt`,
  };
}

export function parseSha1Sums(sums: string, fileName: string): string {
  for (const line of sums.split(/\r?\n/u)) {
    const separator = line.indexOf("  ");
    if (separator === 40 && line.slice(separator + 2) === fileName) {
      const digest = line.slice(0, separator);
      if (/^[\da-f]{40}$/u.test(digest)) {
        return digest;
      }
    }
  }
  throw new Error(`Official SHA-1 list does not contain ${fileName}.`);
}
