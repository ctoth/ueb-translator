import {
  brotliCompressSync,
  constants,
  gzipSync,
} from "node:zlib";

import { build } from "esbuild";

async function browserBundle(minify: boolean): Promise<Uint8Array> {
  const result = await build({
    bundle: true,
    entryPoints: ["src/index.ts"],
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

const raw = await browserBundle(false);
const minified = await browserBundle(true);
const gzip = gzipSync(minified, { level: 9 });
const brotli = brotliCompressSync(minified, {
  params: {
    [constants.BROTLI_PARAM_QUALITY]: 11,
  },
});

console.log(
  JSON.stringify(
    {
      brotli: brotli.byteLength,
      gzip: gzip.byteLength,
      minified: minified.byteLength,
      raw: raw.byteLength,
      unit: "bytes",
    },
    undefined,
    2,
  ),
);
