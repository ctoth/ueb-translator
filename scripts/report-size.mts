import {
  brotliCompressSync,
  constants,
  gzipSync,
} from "node:zlib";
import { resolve } from "node:path";

import { build } from "esbuild";
import { npmPack } from "./npm-pack.mts";

interface BundleSizes {
  readonly brotli: number;
  readonly gzip: number;
  readonly minified: number;
  readonly raw: number;
}

interface PackageSizes {
  readonly files: number;
  readonly packed: number;
  readonly unpacked: number;
}

function packageSizes(): PackageSizes {
  const packedPackage = npmPack({
    cwd: resolve(import.meta.dirname, ".."),
    kind: "dry-run",
  });
  return {
    files: packedPackage.files.length,
    packed: packedPackage.size,
    unpacked: packedPackage.unpackedSize,
  };
}

async function browserBundle(
  entryPoint: string,
  minify: boolean,
): Promise<Uint8Array> {
  const result = await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: "esm",
    legalComments: "none",
    minify,
    platform: "browser",
    target: ["es2022"],
    write: false,
  });
  const output = result.outputFiles[0];
  if (output === undefined) {
    throw new Error("esbuild did not produce a JavaScript browser bundle.");
  }
  return output.contents;
}

async function measure(entryPoint: string): Promise<BundleSizes> {
  const raw = await browserBundle(entryPoint, false);
  const minified = await browserBundle(entryPoint, true);
  const gzip = gzipSync(minified, { level: 9 });
  const brotli = brotliCompressSync(minified, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
    },
  });
  return {
    brotli: brotli.byteLength,
    gzip: gzip.byteLength,
    minified: minified.byteLength,
    raw: raw.byteLength,
  };
}

console.log(
  JSON.stringify(
    {
      backtranslation: await measure("src/backtranslation.ts"),
      cells: await measure("src/cell.ts"),
      combined: await measure("src/index.ts"),
      grade1: await measure("src/grade1.ts"),
      grade2: await measure("src/grade2.ts"),
      grade2Diagnostics: await measure("src/grade2-diagnostics.ts"),
      package: packageSizes(),
      technical: await measure("src/technical.ts"),
      unit: "bytes",
    },
    undefined,
    2,
  ),
);
