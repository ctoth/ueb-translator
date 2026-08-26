export interface ExtractedPage {
  readonly id: string;
  readonly text: string;
  readonly title: string;
}

const GUTENBERG_START = /^\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK.*\*{3}\s*$/imu;
const GUTENBERG_END = /^\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK.*\*{3}\s*$/imu;

function decodeXml(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

export function normalizeReadingText(text: string): string {
  const lines = text
    .normalize("NFC")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\u00a0", " ")
    .split("\n")
    .map((line) => line.replace(/[\t\v\f ]+/gu, " ").trim());
  const normalized = lines.join("\n").replace(/\n{3,}/gu, "\n\n").trim();
  return normalized.length === 0 ? "" : `${normalized}\n`;
}

export function extractGutenbergBody(text: string): string {
  const start = GUTENBERG_START.exec(text);
  const contentStart = start === null ? 0 : start.index + start[0].length;
  const remaining = text.slice(contentStart);
  const end = GUTENBERG_END.exec(remaining);
  const contentEnd = end === null ? remaining.length : end.index;
  return normalizeReadingText(remaining.slice(0, contentEnd));
}

function stripTemplates(text: string): string {
  let current = text;
  let previous: string;
  do {
    previous = current;
    current = current.replace(/\{\{[^{}]*\}\}/gu, " ");
  } while (current !== previous);
  return current;
}

function wikilinkReadingText(contents: string): string {
  return contents.slice(contents.lastIndexOf("|") + 1);
}

function stripWikitext(text: string): string {
  return normalizeReadingText(
    stripTemplates(decodeXml(text))
      .replace(/<!--[\s\S]*?-->/gu, " ")
      .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/giu, " ")
      .replace(/<ref\b[^/]*\/\s*>/giu, " ")
      .replace(/^\s*(?:\[\[Category:|__)[^\n]*$/gimu, " ")
      .replace(/\[\[([^\]]+)\]\]/gu, (_match: string, contents: string) =>
        wikilinkReadingText(contents),
      )
      .replace(/\[(?:https?:\/\/)[^\s\]]+(?:\s+([^\]]+))?\]/giu, "$1")
      .replace(/'{2,5}/gu, "")
      .replace(/<[^>]+>/gu, " ")
      .replace(/^\s*[=]{2,}\s*(.*?)\s*[=]{2,}\s*$/gmu, "$1"),
  );
}

function element(page: string, name: string): string | undefined {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "iu").exec(
    page,
  );
  return match?.[1];
}

export function readWikinewsPages(xml: string): readonly ExtractedPage[] {
  const pages: ExtractedPage[] = [];
  for (const pageMatch of xml.matchAll(/<page>[\s\S]*?<\/page>/giu)) {
    const page = pageMatch[0].slice("<page>".length, -"</page>".length);
    if (page.includes("<redirect")) {
      continue;
    }
    const namespace = element(page, "ns");
    const id = element(page, "id");
    const title = element(page, "title");
    const rawText = element(page, "text");
    if (
      namespace !== "0" ||
      id === undefined ||
      title === undefined ||
      rawText === undefined
    ) {
      continue;
    }
    const text = stripWikitext(rawText);
    if (text.length > 0) {
      pages.push({
        id: `wikinews:${id}`,
        text,
        title: decodeXml(title),
      });
    }
  }
  return pages;
}
