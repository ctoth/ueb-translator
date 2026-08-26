import type { CorpusDocumentRecord } from "./corpus.js";

interface TranslationSuccess {
  readonly braille: string;
  readonly ok: true;
}

interface TranslationFailure {
  readonly ok: false;
  readonly reason: string;
}

type TranslationResult = TranslationFailure | TranslationSuccess;

interface MemorySample {
  readonly heapUsed: number;
  readonly rss: number;
}

export interface BenchmarkDependencies {
  readonly clock: () => number;
  readonly documents: readonly CorpusDocumentRecord[];
  readonly memoryUsage: () => MemorySample;
  readonly readText: (record: CorpusDocumentRecord) => string;
  readonly translate: (text: string) => TranslationResult;
}

export interface TranslationBenchmark {
  readonly documents: number;
  readonly elapsedSeconds: number;
  readonly inputUtf8Bytes: number;
  readonly outputCells: number;
  readonly peakHeapBytes: number;
  readonly peakRssBytes: number;
  readonly throughputUtf8BytesPerSecond: number;
  readonly translatedDocuments: number;
  readonly unsupportedDocuments: number;
}

export function benchmarkDocuments(
  dependencies: BenchmarkDependencies,
): TranslationBenchmark {
  let inputUtf8Bytes = 0;
  let outputCells = 0;
  let peakHeapBytes = 0;
  let peakRssBytes = 0;
  let translatedDocuments = 0;
  let unsupportedDocuments = 0;
  const startedAt = dependencies.clock();

  for (const document of dependencies.documents) {
    const text = dependencies.readText(document);
    inputUtf8Bytes += Buffer.byteLength(text, "utf8");
    const result = dependencies.translate(text);
    if (result.ok) {
      translatedDocuments += 1;
      outputCells += Array.from(result.braille).length;
    } else {
      unsupportedDocuments += 1;
    }
    const memory = dependencies.memoryUsage();
    peakHeapBytes = Math.max(peakHeapBytes, memory.heapUsed);
    peakRssBytes = Math.max(peakRssBytes, memory.rss);
  }

  const elapsedSeconds = (dependencies.clock() - startedAt) / 1000;
  return {
    documents: dependencies.documents.length,
    elapsedSeconds,
    inputUtf8Bytes,
    outputCells,
    peakHeapBytes,
    peakRssBytes,
    throughputUtf8BytesPerSecond:
      elapsedSeconds === 0 ? 0 : inputUtf8Bytes / elapsedSeconds,
    translatedDocuments,
    unsupportedDocuments,
  };
}
