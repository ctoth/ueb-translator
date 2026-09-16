// Run after npm run build: node scripts/audit-contraction-families.mts
// Report diagnostic evidence; this is not an independent translation oracle.
import { traceGrade2 } from "../dist/grade2-diagnostics.js";

const probes = [
  "centimeters", "centimeter's", "centimeter’s", "centimeters'",
  "centimeter-long", "centimeters-long", "'centimeter'",
  "ornaments", "anemones", "gasometers", "poisoners",
  "multimeter", "hereditary", "enameling", "villainesses",
  "beaded", "cones", "microfilming", "somersaulting",
] as const;

for (const word of probes) {
  const result = traceGrade2(word);
  console.log(JSON.stringify({ word, ...result }));
}
