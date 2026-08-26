import {
  brotliCompressSync,
  constants,
  gzipSync,
} from "node:zlib";

import { build } from "esbuild";

interface BundleSizes {
  readonly brotli: number;
  readonly gzip: number;
  readonly minified: number;
  readonly raw: number;
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
      literary: await measure("src/index.ts"),
      technical: await measure("src/technical.ts"),
      unit: "bytes",
    },
    undefined,
    2,
  ),
);
