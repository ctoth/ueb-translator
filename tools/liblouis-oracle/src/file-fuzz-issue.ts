import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fileFuzzDivergence, isFuzzFailure } from "./fuzz-issue.js";

function main(): void {
  const resultPath = resolve(
    process.env["ORACLE_FUZZ_RESULT"] ?? ".oracle-artifacts/fuzz-result.json",
  );
  const value: unknown = JSON.parse(readFileSync(resultPath, "utf8"));
  if (!isFuzzFailure(value)) {
    console.log("No new fuzz divergence to file.");
    return;
  }
  const repository = process.env["GITHUB_REPOSITORY"];
  if (repository === undefined || repository.length === 0) {
    throw new Error("GITHUB_REPOSITORY is required for issue filing.");
  }
  const url = fileFuzzDivergence(value, repository, (arguments_) =>
    execFileSync("gh", arguments_, { encoding: "utf8" })
  );
  console.log(url);
}

main();
