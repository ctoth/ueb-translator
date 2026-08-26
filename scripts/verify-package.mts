import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { build, type Metafile } from "esbuild";
import { chromium, type Browser } from "playwright";
import ts from "typescript";
import { npmPack, type PackedFile } from "./npm-pack.mts";

interface BrowserEntryPoint {
  readonly check: string;
  readonly name: string;
  readonly specifier: string;
}

const ENTRY_POINTS = [
  {
    check: 'entry.translateUeb({ input: "A", mode: "grade1" }).braille === "⠠⠁"',
    name: "combined",
    specifier: "ueb-translator",
  },
  {
    check: 'entry.encodeCell([1, 2, 3, 4, 5, 6]) === "⠿"',
    name: "cells",
    specifier: "ueb-translator/cells",
  },
  {
    check: 'entry.translateGrade1("A").braille === "⠠⠁"',
    name: "grade1",
    specifier: "ueb-translator/grade1",
  },
  {
    check: 'entry.translateGrade2("and").braille === "⠯"',
    name: "grade2",
    specifier: "ueb-translator/grade2",
  },
  {
    check: 'entry.traceGrade2("and").braille === "⠯"',
    name: "grade2-diagnostics",
    specifier: "ueb-translator/grade2/diagnostics",
  },
  {
    check: 'entry.translateTechnicalInput({ kind: "technical-text", text: "3+2=5" }).ok === true',
    name: "technical",
    specifier: "ueb-translator/technical",
  },
  {
    check: 'entry.backtranslateGrade1("⠁").kind === "unique"',
    name: "backtranslation",
    specifier: "ueb-translator/backtranslation",
  },
] satisfies readonly BrowserEntryPoint[];

const EXPECTED_EXPORTS = ENTRY_POINTS.map(({ specifier }) =>
  specifier === "ueb-translator"
    ? "."
    : `./${specifier.slice("ueb-translator/".length)}`
).sort();

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function run(command: string, args: readonly string[], cwd: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const output = `${result.stdout}${result.stderr}`;
  if (result.error !== undefined) {
    throw new Error(`${command} could not start: ${result.error.message}\n${output}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} exited ${String(result.status)}.\n${output}`);
  }
  return result.stdout;
}

function validatePackedFiles(files: readonly PackedFile[]): void {
  const invalid = files
    .map(({ path }) => path)
    .filter((path) =>
      path !== "LICENSE" && path !== "README.md" && path !== "package.json" &&
      !/^dist\/.+\.(?:d\.ts|js)$/u.test(path)
    );
  if (invalid.length > 0) {
    throw new Error(`Unexpected packed files: ${invalid.join(", ")}`);
  }
}

function validateExportMap(packageJson: unknown): void {
  if (!isRecord(packageJson) || !isRecord(packageJson["exports"])) {
    throw new Error("Packed package.json has no object exports map.");
  }
  const actual = Object.keys(packageJson["exports"]).sort();
  if (actual.join("\n") !== EXPECTED_EXPORTS.join("\n")) {
    throw new Error(
      `Packed exports differ. Expected ${EXPECTED_EXPORTS.join(", ")}; got ${actual.join(", ")}.`,
    );
  }
  const dependencies = packageJson["dependencies"];
  if (dependencies !== undefined && (!isRecord(dependencies) || Object.keys(dependencies).length > 0)) {
    throw new Error("Packed package has runtime dependencies.");
  }
}

function declarationProblems(path: string, sourceText: string): readonly string[] {
  const source = ts.createSourceFile(
    path,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const problems: string[] = [];
  for (const directive of source.typeReferenceDirectives) {
    if (directive.fileName === "node") {
      problems.push(`${path}: references Node types`);
    }
  }
  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      problems.push(`${path}:${String(source.getLineAndCharacterOfPosition(node.pos).line + 1)} uses any`);
    } else if (
      ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      problems.push(`${path}:${String(source.getLineAndCharacterOfPosition(node.pos).line + 1)} uses an assertion escape hatch`);
    } else if (
      ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith("node:")
    ) {
      problems.push(`${path}: imports ${node.moduleSpecifier.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return problems;
}

async function validateDeclarations(
  packageRoot: string,
  files: readonly PackedFile[],
): Promise<number> {
  const declarationPaths = files
    .map(({ path }) => path)
    .filter((path) => path.endsWith(".d.ts"));
  const problems: string[] = [];
  for (const path of declarationPaths) {
    const sourceText = await readFile(resolve(packageRoot, path), "utf8");
    problems.push(...declarationProblems(path, sourceText));
  }
  if (problems.length > 0) {
    throw new Error(`Unsafe public declarations:\n${problems.join("\n")}`);
  }
  return declarationPaths.length;
}

async function validateConsumerTypes(fixtureRoot: string): Promise<void> {
  const consumerPath = resolve(fixtureRoot, "consumer.mts");
  await writeFile(
    consumerPath,
    `
import { translateUeb, type UebTranslationRequest } from "ueb-translator";
import { encodeCell, type UebDot } from "ueb-translator/cells";
import { translateGrade1, type Grade1Document } from "ueb-translator/grade1";
import { translateGrade2, type Grade2Document } from "ueb-translator/grade2";
import { traceGrade2 } from "ueb-translator/grade2/diagnostics";
import { translateTechnicalInput, type TechnicalInput } from "ueb-translator/technical";
import { backtranslateGrade1 } from "ueb-translator/backtranslation";

const request = { input: "A", mode: "grade1" } satisfies UebTranslationRequest;
const dots = [1, 2] satisfies readonly UebDot[];
const grade1 = { kind: "grade1-document", paragraphs: [] } satisfies Grade1Document;
const grade2 = { kind: "grade2-document", runs: [] } satisfies Grade2Document;
const technical = { kind: "technical-text", text: "3+2=5" } satisfies TechnicalInput;
void [translateUeb(request), encodeCell(dots), translateGrade1(grade1), translateGrade2(grade2), traceGrade2("and"), translateTechnicalInput(technical), backtranslateGrade1("⠁")];
`,
    "utf8",
  );
  const program = ts.createProgram({
    options: {
      exactOptionalPropertyTypes: true,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      noUncheckedIndexedAccess: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      types: [],
      verbatimModuleSyntax: true,
    },
    rootNames: [consumerPath],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: () => fixtureRoot,
        getNewLine: () => "\n",
      }),
    );
  }
}

function grade1Isolated(metafile: Metafile): boolean {
  return !Object.keys(metafile.inputs).some((path) =>
    /(?:^|[/\\])(?:grade2(?:-diagnostics)?|technical)\.js$/u.test(path) ||
    /(?:^|[/\\])generated[/\\]grade2-program\.js$/u.test(path)
  );
}

async function browserBundle(
  fixtureRoot: string,
  entryPoint: BrowserEntryPoint,
): Promise<{ readonly code: string; readonly metafile: Metafile }> {
  const result = await build({
    absWorkingDir: fixtureRoot,
    bundle: true,
    format: "iife",
    legalComments: "none",
    metafile: true,
    minify: true,
    platform: "browser",
    stdin: {
      contents: `import * as entry from ${JSON.stringify(entryPoint.specifier)}; if (!(${entryPoint.check})) throw new Error(${JSON.stringify(`${entryPoint.name} browser check failed`)}); globalThis.__uebPackageEntry = ${JSON.stringify(entryPoint.name)};`,
      loader: "js",
      resolveDir: fixtureRoot,
      sourcefile: `${entryPoint.name}.mjs`,
    },
    target: ["es2022"],
    write: false,
  });
  const output = result.outputFiles[0];
  if (output === undefined) {
    throw new Error(`esbuild produced no ${entryPoint.name} browser bundle.`);
  }
  return { code: output.text, metafile: result.metafile };
}

async function executeInBrowser(browser: Browser, name: string, code: string): Promise<void> {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.addScriptTag({ content: code });
    await page.waitForFunction(
      (expected) => globalThis.__uebPackageEntry === expected,
      name,
    );
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  } finally {
    await page.close();
  }
}

const repositoryRoot = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "ueb-translator-package-"));
let browser: Browser | undefined;

try {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const pack = npmPack({
    cwd: repositoryRoot,
    destination: temporaryRoot,
    kind: "archive",
  });
  validatePackedFiles(pack.files);

  const fixtureRoot = resolve(temporaryRoot, "fixture");
  await mkdir(fixtureRoot);
  await writeFile(
    resolve(fixtureRoot, "package.json"),
    '{"name":"ueb-translator-clean-fixture","private":true,"type":"module"}\n',
    "utf8",
  );
  run(
    npmCommand,
    [
      "install",
      "--prefix",
      fixtureRoot,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      resolve(temporaryRoot, pack.filename),
    ],
    temporaryRoot,
  );
  const packageRoot = resolve(fixtureRoot, "node_modules", "ueb-translator");
  const packedPackageJson: unknown = JSON.parse(
    await readFile(resolve(packageRoot, "package.json"), "utf8"),
  );
  validateExportMap(packedPackageJson);
  const declarationCount = await validateDeclarations(packageRoot, pack.files);
  await validateConsumerTypes(fixtureRoot);

  browser = await chromium.launch({ headless: true });
  let isolated = false;
  for (const entryPoint of ENTRY_POINTS) {
    const bundle = await browserBundle(fixtureRoot, entryPoint);
    await executeInBrowser(browser, entryPoint.name, bundle.code);
    if (entryPoint.name === "grade1") {
      isolated = grade1Isolated(bundle.metafile);
    }
  }
  if (!isolated) {
    throw new Error("The Grade 1 browser bundle retained Grade 2 or technical modules.");
  }

  console.log(JSON.stringify({
    browser: "chromium",
    declarations: declarationCount,
    entryPoints: ENTRY_POINTS.map(({ specifier }) => specifier),
    files: pack.files.length,
    grade1Isolated: isolated,
    packedBytes: pack.size,
    unpackedBytes: pack.unpackedSize,
  }));
} finally {
  await browser?.close();
  await rm(temporaryRoot, { force: true, recursive: true });
}

declare global {
  var __uebPackageEntry: string | undefined;
}
