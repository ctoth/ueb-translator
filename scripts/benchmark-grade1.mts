import { translateGrade1 } from "../dist/grade1.js";

const byteCount = 1024 * 1024;
const input = "a".repeat(byteCount);
translateGrade1(input.slice(0, 64 * 1024));

const started = performance.now();
const result = translateGrade1(input);
const elapsedMs = performance.now() - started;
if (!result.ok || result.braille.length !== byteCount) {
  throw new Error("The 1 MiB Grade 1 benchmark did not translate completely.");
}
if (elapsedMs >= 1_000) {
  throw new Error(`The 1 MiB Grade 1 benchmark took ${elapsedMs.toFixed(3)} ms.`);
}
process.stdout.write(`${JSON.stringify({ byteCount, elapsedMs, ok: true })}\n`);
