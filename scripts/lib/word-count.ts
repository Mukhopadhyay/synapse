import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
const SKIPPED = new Set(["code", "heading", "math", "html"]);

/** Words of body prose, excluding code blocks, headings and display math. Decides whether a note is a stub. */
export function countBodyWords(markdown: string): number {
  let words = 0;
  visit(parser.parse(markdown), (node) => {
    if (SKIPPED.has(node.type)) return SKIP;
    if (node.type === "text" || node.type === "inlineCode") {
      words += (node as { value: string }).value.split(/\s+/).filter(Boolean).length;
    }
  });
  return words;
}

/** Body prose as plain text for the search index: headings included, code and math left out. */
export function bodyText(markdown: string): string {
  const parts: string[] = [];
  visit(parser.parse(markdown), (node) => {
    if (node.type === "code" || node.type === "math" || node.type === "html") return SKIP;
    if (node.type === "text" || node.type === "inlineCode") parts.push((node as { value: string }).value);
  });
  return parts.join(" ").replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2");
}
