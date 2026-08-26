export type CorpusPartition = "held-out" | "training";

interface CacheCommand {
  readonly cacheDirectory: string;
}

export interface PrepareEpubCommand extends CacheCommand {
  readonly inputDirectory: string;
  readonly kind: "prepare-epub";
  readonly snapshot: string;
}

export interface PrepareGutenbergCommand extends CacheCommand {
  readonly kind: "prepare-gutenberg";
  readonly snapshot: string;
}

export interface PrepareWikinewsCommand extends CacheCommand {
  readonly kind: "prepare-wikinews";
  readonly snapshot: string;
}

export interface BenchmarkCommand {
  readonly corpusDirectory: string;
  readonly kind: "benchmark";
  readonly partition: CorpusPartition;
}

export type CorpusCommand =
  | BenchmarkCommand
  | PrepareEpubCommand
  | PrepareGutenbergCommand
  | PrepareWikinewsCommand;

interface ParsedOptions {
  readonly cache: string | undefined;
  readonly corpus: string | undefined;
  readonly input: string | undefined;
  readonly partition: string | undefined;
  readonly snapshot: string | undefined;
}

const OPTION_NAMES = new Set([
  "--cache",
  "--corpus",
  "--input",
  "--partition",
  "--snapshot",
]);

function parseOptions(arguments_: readonly string[]): ParsedOptions {
  const values = new Map<string, string>();
  const iterator = arguments_[Symbol.iterator]();
  for (let item = iterator.next(); !item.done; item = iterator.next()) {
    const name = item.value;
    const valueItem = iterator.next();
    const value = valueItem.done ? undefined : valueItem.value;
    if (!OPTION_NAMES.has(name)) {
      throw new Error(`Unknown corpus option: ${name}.`);
    }
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Corpus option ${name} requires a value.`);
    }
    if (values.has(name)) {
      throw new Error(`Corpus option ${name} was supplied more than once.`);
    }
    values.set(name, value);
  }
  return {
    cache: values.get("--cache"),
    corpus: values.get("--corpus"),
    input: values.get("--input"),
    partition: values.get("--partition"),
    snapshot: values.get("--snapshot"),
  };
}

function required(value: string | undefined, option: string): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`Corpus command requires ${option}.`);
  }
  return value;
}

function datedSnapshot(value: string | undefined): string {
  const snapshot = required(value, "--snapshot");
  if (!/^\d{8}$/u.test(snapshot)) {
    throw new Error(
      "Official remote corpora require a dated snapshot in YYYYMMDD form; mutable names such as latest are forbidden.",
    );
  }
  return snapshot;
}

function assertOnly(
  options: ParsedOptions,
  allowed: ReadonlySet<keyof ParsedOptions>,
): void {
  const entries: readonly (readonly [keyof ParsedOptions, string | undefined])[] = [
    ["cache", options.cache],
    ["corpus", options.corpus],
    ["input", options.input],
    ["partition", options.partition],
    ["snapshot", options.snapshot],
  ];
  for (const [name, value] of entries) {
    if (value !== undefined && !allowed.has(name)) {
      throw new Error(`Option --${name} does not apply to this corpus command.`);
    }
  }
}

export function parseCommand(arguments_: readonly string[]): CorpusCommand {
  const action = arguments_[0];
  if (action === "benchmark") {
    const options = parseOptions(arguments_.slice(1));
    assertOnly(options, new Set(["corpus", "partition"]));
    const partition = required(options.partition, "--partition");
    if (partition !== "held-out" && partition !== "training") {
      throw new Error("Benchmark partition must be training or held-out.");
    }
    return {
      corpusDirectory: required(options.corpus, "--corpus"),
      kind: "benchmark",
      partition,
    };
  }

  if (action !== "prepare") {
    throw new Error("Corpus command must be prepare or benchmark.");
  }

  const source = arguments_[1];
  const options = parseOptions(arguments_.slice(2));
  const cacheDirectory = options.cache ?? ".corpus-cache";
  if (source === "epub") {
    assertOnly(options, new Set(["cache", "input", "snapshot"]));
    return {
      cacheDirectory,
      inputDirectory: required(options.input, "--input"),
      kind: "prepare-epub",
      snapshot: required(options.snapshot, "--snapshot"),
    };
  }
  if (source === "gutenberg") {
    assertOnly(options, new Set(["cache", "snapshot"]));
    return {
      cacheDirectory,
      kind: "prepare-gutenberg",
      snapshot: datedSnapshot(options.snapshot),
    };
  }
  if (source === "wikinews") {
    assertOnly(options, new Set(["cache", "snapshot"]));
    return {
      cacheDirectory,
      kind: "prepare-wikinews",
      snapshot: datedSnapshot(options.snapshot),
    };
  }
  throw new Error(`Unknown corpus source: ${String(source)}.`);
}
