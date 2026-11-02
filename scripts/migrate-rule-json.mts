/** One-time migration: print edits for apply_patch; never write source files. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const directory = "rules/ueb-2024/";
const requestedArgument = process.argv[2];
const sourceFiles = ["symbols/source.ts", "modes/source.ts", "policies/source.ts",
  "grade2-rules.ts", "shortforms.ts", "appendix1.ts", "constraints.ts",
  "apostrophes.ts", "technical-signs.ts", "inventory.ts", "program.ts"];
if (requestedArgument === undefined || !sourceFiles.includes(requestedArgument)) {
  throw new Error(`Choose one source: ${sourceFiles.join(", ")}`);
}
const requested: string = requestedArgument;
const path = directory + requested;
const reference = process.argv[3];
const original = reference === undefined ? await readFile(resolve(root, path), "utf8")
  : execFileSync("git", ["show", `${reference}:${path}`], { cwd: root, encoding: "utf8" });
const source = ts.createSourceFile(path, original, ts.ScriptTarget.Latest, true);
const declarations = new Map<string, ts.VariableDeclaration>();
for (const statement of source.statements) {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, declaration);
    }
  }
}
function initializer(name: string): ts.Expression {
  const node = declarations.get(name)?.initializer;
  if (node === undefined) throw new Error(`Missing initializer ${name}`);
  return node;
}
function literal(node: ts.Expression): unknown {
  if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
    return literal(node.expression);
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
    if (!ts.isPropertyAssignment(property) ||
      (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))) {
      throw new Error("Unsupported object property");
    }
    return [property.name.text, literal(property.initializer)];
  }));
  throw new Error(`Unsupported literal: ${node.getText(source)}`);
}
function calls(name: string, helper: string): readonly (readonly unknown[])[] {
  const node = initializer(name);
  if (!ts.isArrayLiteralExpression(node)) throw new Error(`Expected array ${name}`);
  return node.elements.map(element => {
    const call = ts.isSpreadElement(element) ? element.expression : element;
    if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== helper) {
      throw new Error(`Unsupported ${helper} construction: ${call.getText(source)}`);
    }
    return call.arguments.map(literal);
  });
}
function wordEntries(node: ts.Expression): readonly unknown[] {
  if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(element => {
    if (ts.isSpreadElement(element)) return wordEntries(element.expression);
    if (ts.isStringLiteral(element)) return [element.text];
    throw new Error(`Unsupported word entry: ${element.getText(source)}`);
  });
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "family") {
    const [base, suffixes] = node.arguments.map(literal);
    return [{ base, suffixes }];
  }
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "flatMap") {
    const callback = node.arguments[0];
    if (callback === undefined || !ts.isArrowFunction(callback) || !ts.isCallExpression(callback.body) ||
      !ts.isIdentifier(callback.body.expression) || callback.body.expression.text !== "family") throw new Error("Unsupported family mapping");
    const suffixes = callback.body.arguments[1];
    if (suffixes === undefined) throw new Error("Missing family suffixes");
    const bases = literal(node.expression.expression);
    if (!Array.isArray(bases)) throw new Error("Expected family bases");
    return bases.map((base: unknown) => ({ base, suffixes: literal(suffixes) }));
  }
  throw new Error(`Unsupported words: ${node.getText(source)}`);
}
function constraintWords(name: string): readonly (readonly unknown[])[] {
  const initial = initializer(name);
  const nodes = ts.isArrayLiteralExpression(initial) ? initial.elements : [initial];
  return nodes.map(node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "initialExceptions") {
      const words = node.arguments[2];
      if (words === undefined) throw new Error("Missing exception words");
      return wordEntries(words);
    }
    if (!ts.isObjectLiteralExpression(node)) throw new Error("Unsupported exception definition");
    const property = node.properties.find(property => ts.isPropertyAssignment(property) && property.name.getText(source) === "words");
    if (property === undefined || !ts.isPropertyAssignment(property)) throw new Error("Missing words field");
    return wordEntries(property.initializer);
  });
}
const imported: unknown = await import(pathToFileURL(resolve(root,
  "node_modules/.cache/ueb-translator/grade2-rules", path.replace(/\.ts$/u, ".js"))).href);
function exported(name: string): unknown {
  if (typeof imported !== "object" || imported === null || !(name in imported)) {
    throw new Error(`Missing reference export ${name}`);
  }
  return Reflect.get(imported, name);
}
interface Edit { readonly start: number; readonly end: number; readonly text: string }
const edits: Edit[] = [];
const files: { path: string; content: string }[] = [];
const imports: string[] = [];
const readers = new Set<string>();
const report: string[] = [];
function data(name: string, filename: string, value: unknown, expression: string): void {
  const raw = `json${imports.length}`;
  imports.push(`import ${raw} from "./${filename}" with { type: "json" };`);
  files.push({ path: directory + requested.replace(/[^/]+$/u, "") + filename,
    content: JSON.stringify(value, undefined, 2) + "\n" });
  const node = initializer(name);
  const replacement = expression.replaceAll("$json", raw);
  edits.push({ start: node.getStart(source), end: node.end, text: replacement });
  for (const match of replacement.matchAll(/\b(read[A-Z]\w*)\(/gu)) readers.add(match[1] ?? "");
  report.push(`${name}: ${filename}`);
}
function remove(names: readonly string[]): void {
  for (const statement of source.statements) {
    const matches = ts.isFunctionDeclaration(statement)
      ? statement.name !== undefined && names.includes(statement.name.text)
      : ts.isVariableStatement(statement) && statement.declarationList.declarations.every(declaration =>
        ts.isIdentifier(declaration.name) && names.includes(declaration.name.text));
    if (matches) edits.push({ start: statement.getStart(source), end: statement.end, text: "" });
  }
}
function unionMetadata(name: string, constant: string): void {
  const node = source.statements.find(statement => ts.isTypeAliasDeclaration(statement) && statement.name.text === name);
  if (node === undefined || !ts.isTypeAliasDeclaration(node) || !ts.isUnionTypeNode(node.type)) {
    throw new Error(`Missing union ${name}`);
  }
  const values = node.type.types.map(type => {
    if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) throw new Error(`Nonliteral union ${name}`);
    return type.literal.text;
  });
  edits.push({ start: node.getStart(source), end: node.end,
    text: `export const ${constant} = ${JSON.stringify(values)} as const;\n` +
      `export type ${name} = (typeof ${constant})[number];` });
}
switch (requested) {
  case "symbols/source.ts": {
    for (const name of ["LATIN", "MODIFIERS", "GREEK", "GENERAL_SYMBOLS"]) {
      data(name, `${name.toLowerCase().replaceAll("_", "-")}.json`, literal(initializer(name)), "readPairs($json)");
    }
    // These full records are independent additions, not derived alphabet copies.
    const compiled = exported("SYMBOL_RULES");
    if (!Array.isArray(compiled)) throw new Error("Missing symbol reference");
    data("special", "special.json", compiled.filter((entry: unknown) =>
      typeof entry === "object" && entry !== null && "id" in entry &&
      typeof entry.id === "string" && /^UEB-4\.[46]\.1-/u.test(entry.id)),
    "readSymbolRules($json)");
    const array = initializer("SYMBOL_RULES");
    if (!ts.isArrayLiteralExpression(array)) throw new Error("Expected symbol list");
    const last = array.elements.at(-1);
    if (last === undefined || !ts.isCallExpression(last)) throw new Error("Expected final symbol");
    const raw = `json${imports.length}`;
    imports.push(`import ${raw} from "./vertical-bar.json" with { type: "json" };`);
    files.push({ path: directory + "symbols/vertical-bar.json",
      content: JSON.stringify([compiled.at(-1)], undefined, 2) + "\n" });
    edits.push({ start: last.getStart(source), end: last.end, text: `...readSymbolRules(${raw})` });
    break;
  }
  case "modes/source.ts":
    data("MODE_RULES", "rules.json", exported("MODE_RULES"), "readModeRules($json)");
    remove(["mode"]);
    break;
  case "policies/source.ts":
    data("COMPOSITION_POLICY_RULES", "rules.json", exported("COMPOSITION_POLICY_RULES"), "readCompositionRules($json)");
    break;
  case "grade2-rules.ts": {
    const groups = calls("GRADE2_RULES", "rules").map(([kind, precedence, entries, guards = []]) =>
      ({ kind, precedence, entries, guards }));
    data("GRADE2_RULES", "grade2-rules.json", groups,
      "readGrade2Rules($json, GRADE2_RULE_KINDS, GRADE2_RULE_LOCATOR_BY_KIND)");
    data("GRADE2_RULE_LOCATOR_BY_KIND", "grade2-locators.json", literal(initializer("GRADE2_RULE_LOCATOR_BY_KIND")), "readGrade2Locators($json)");
    remove(["rules"]);
    unionMetadata("Grade2RuleKind", "GRADE2_RULE_KINDS");
    break;
  }
  case "shortforms.ts":
    data("SHORTFORMS", "shortforms.json", calls("SHORTFORMS", "shortform"),
      "readPairs($json).map(([print, braille]) => shortform(print, braille))");
    break;
  case "appendix1.ts":
    data("APPENDIX1_LONGER_WORDS", "appendix1.json",
      calls("APPENDIX1_LONGER_WORDS", "words").map(([base, words]) => ({ base, words })),
      "readAppendixGroups($json, APPENDIX1_BASES).flatMap(group => words(group.base, group.words))");
    unionMetadata("Appendix1Base", "APPENDIX1_BASES");
    break;
  case "constraints.ts":
    for (const [name, file, reader] of [
      ["COMPOUND_CONTRACTION_EXCEPTIONS", "compound-exceptions", "readCompoundExceptions"],
      ["FIRST_SYLLABLE_CONTRACTION_EXCEPTIONS", "syllable-exceptions", "readSyllableExceptions"],
      ["FIRST_SYLLABLE_VOWEL_WORDS", "syllable-vowel-words", "readVowelWords"],
      ["INITIAL_CONTRACTION_EXCEPTIONS", "initial-exceptions", "readInitialExceptions"],
      ["FINAL_GROUPSIGN_EXCEPTIONS", "final-exceptions", "readFinalExceptions"],
    ]) {
      if (name === undefined || file === undefined || reader === undefined) throw new Error("Invalid conversion entry");
      const referenceValue = exported(name);
      const words = constraintWords(name);
      const compact = Array.isArray(referenceValue)
        ? referenceValue.map((entry: unknown, index) => {
          if (typeof entry !== "object" || entry === null) throw new Error("Malformed exception reference");
          return { ...entry, words: words[index] };
        })
        : typeof referenceValue === "object" && referenceValue !== null ? { ...referenceValue, words: words[0] }
        : (() => { throw new Error("Malformed exception source"); })();
      data(name, `${file}.json`, compact, `${reader}($json)`);
    }
    remove(["family", "initialExceptions"]);
    break;
  case "apostrophes.ts":
    data("INITIAL_ELISION_WORDS", "apostrophes.json", exported("INITIAL_ELISION_WORDS"), "readStrings($json)");
    break;
  case "inventory.ts":
    data("GRADE2_INVENTORY_COUNTS", "inventory.json", exported("GRADE2_INVENTORY_COUNTS"), "readInventory($json)");
    {
      const declaration = declarations.get("GRADE2_INVENTORY_COUNTS");
      if (declaration === undefined) throw new Error("Missing inventory declaration");
      edits.push({ start: declaration.name.end, end: declaration.name.end,
        text: ": ReturnType<typeof readInventory>" });
    }
    break;
  case "program.ts": {
    data("NO_STRUCTURAL_CROSSING", "structural-crossing.json", literal(initializer("NO_STRUCTURAL_CROSSING")), "readStructuralGuard($json)");
    const set = initializer("GENERAL_LONGER_SHORTFORMS");
    if (!ts.isNewExpression(set) || set.arguments?.[0] === undefined) throw new Error("Expected longer shortforms set");
    data("GENERAL_LONGER_SHORTFORMS", "longer-shortforms.json", literal(set.arguments[0]), "new Set(readStrings($json))");
    break;
  }
  case "technical-signs.ts":
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) throw new Error("Unsupported exported binding");
        const name = declaration.name.text;
        const filename = name.toLowerCase().replace(/^technical_/u, "technical-").replaceAll("_", "-") + ".json";
        const reader = name === "TECHNICAL_SYMBOL_RULES" ? "readSymbolRules"
          : "read" + name.toLowerCase().split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
        data(name, filename, exported(name), `${reader}($json)`);
      }
    }
    remove(["additionalSigns", "subscript", "superscript"]);
    break;
}
// Remove obsolete constructor-only imports, retaining all domain types.
const obsolete = new Set(requested === "modes/source.ts"
  ? ["citeIceb", "Grade1RuleLocator", "ModeDefinitionSource", "ModeIndicatorsSource", "ModeMemberClass", "ModeRuleName"]
  : ["policies/source.ts", "constraints.ts", "grade2-rules.ts"].includes(requested) ? ["citeIceb"]
  : requested === "technical-signs.ts" ? ["citeTechnicalSign", "TechnicalSignLocator"] : []);
for (const statement of source.statements) {
  if (!ts.isImportDeclaration(statement) || statement.importClause?.namedBindings === undefined ||
    !ts.isNamedImports(statement.importClause.namedBindings)) continue;
  const bindings = statement.importClause.namedBindings.elements;
  const retained = bindings.filter(binding => !obsolete.has(binding.name.text));
  if (bindings.length === retained.length) continue;
  const printer = ts.createPrinter();
  const updated = retained.length === 0 ? "" : printer.printNode(ts.EmitHint.Unspecified,
    ts.factory.updateImportDeclaration(statement, statement.modifiers,
      ts.factory.updateImportClause(statement.importClause, statement.importClause.isTypeOnly,
        statement.importClause.name, ts.factory.updateNamedImports(statement.importClause.namedBindings, retained)),
      statement.moduleSpecifier, statement.attributes), source);
  edits.push({ start: statement.getStart(source), end: statement.end, text: updated });
}
let content = original;
for (const edit of edits.sort((left, right) => right.start - left.start)) {
  content = content.slice(0, edit.start) + edit.text + content.slice(edit.end);
}
const relative = requested.includes("/") ? "../rule-json.js" : "./rule-json.js";
content = imports.join("\n") + `\nimport { ${[...readers].join(", ")} } from "${relative}";\n` + content;
files.push({ path, content });
const notes: string[] = [];
const commentOffsets = new Set<number>();
function collectNotes(node: ts.Node): void {
  for (const range of [...(ts.getLeadingCommentRanges(original, node.pos) ?? []),
    ...(ts.getTrailingCommentRanges(original, node.end) ?? [])]) {
    if (!commentOffsets.has(range.pos) && edits.some(edit => range.pos >= edit.start && range.end <= edit.end)) {
      commentOffsets.add(range.pos);
      notes.push(original.slice(range.pos, range.end));
    }
  }
  ts.forEachChild(node, collectNotes);
}
collectNotes(source);
process.stdout.write(JSON.stringify({ files, report, notes }));
