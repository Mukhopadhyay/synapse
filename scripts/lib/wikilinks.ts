import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/** `[[target]]`, `[[target|label]]`, `[[target#section]]`: group 1 is the target, group 2 the label. */
export const WIKILINK = /\[\[([^[\]|#]+)(?:#[^[\]|]*)?(?:\|([^[\]]*))?\]\]/g;
const parser = unified().use(remarkParse);

/** The Markdown syntax tree (mdast), typed from the parser rather than a separate types package. */
export type MdastRoot = ReturnType<typeof parser.parse>;

/** Wikilink targets in prose; code is ignored. */
export function extractWikilinks(markdown: string): string[] {
  const tree = parser.parse(markdown);
  const targets = new Set<string>();
  visit(tree, "text", (node) => {
    for (const match of node.value.matchAll(WIKILINK)) targets.add(match[1].trim());
  });
  return [...targets];
}
