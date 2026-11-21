import rehypeShiki from "@shikijs/rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createCssVariablesTheme } from "shiki/core";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

import { noteHref } from "../../src/lib/content/note-url.ts";
import type { NoteBody } from "../../src/lib/content/schema.ts";
import { remarkLinkCards } from "./link-previews/cards.ts";
import { plainCard, type CardData } from "./link-previews/index.ts";
import { WIKILINK, type MdastRoot } from "./wikilinks.ts";

export type LinkTarget = { title: string; ghost: boolean; domain: string };

type Inline = { type: "text"; value: string } | { type: "link"; url: string; children: Inline[]; data?: object };

/** Code colours come from CSS variables (`--shiki-token-*`) mapped onto design tokens in globals.css. */
const codeTheme = createCssVariablesTheme({ name: "synapse", variablePrefix: "--shiki-", fontStyle: true });

/** `[[slug]]`, `[[slug|label]]`, `[[domain/slug#section]]` → `<a href="/<domain>/graph/slug" data-slug>`; ghosts get `data-ghost`. */
function remarkWikilinks(options: { resolve: (target: string) => { slug: string; target?: LinkTarget } }) {
  return (tree: MdastRoot) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined || !node.value.includes("[[")) return;
      const parts: Inline[] = [];
      let last = 0;
      for (const match of node.value.matchAll(new RegExp(WIKILINK.source, "g"))) {
        const [raw, target, label] = match;
        if (match.index > last) parts.push({ type: "text", value: node.value.slice(last, match.index) });
        const { slug, target: resolved } = options.resolve(target.trim());
        const ghost = resolved?.ghost ?? true;
        parts.push({
          type: "link",
          url: resolved ? noteHref(resolved.domain, slug) : "#",
          children: [{ type: "text", value: label?.trim() || resolved?.title || slug }],
          data: {
            hProperties: { className: ghost ? ["wikilink", "wikilink-ghost"] : ["wikilink"], "data-slug": slug, ...(ghost && { "data-ghost": "" }) },
          },
        });
        last = match.index + raw.length;
      }
      if (parts.length === 0) return;
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      parent.children.splice(index, 1, ...(parts as typeof parent.children));
      return [SKIP, index + parts.length];
    });
  };
}

/**
 * Renders a note body to HTML at build time: GFM, KaTeX math, Shiki code, wikilinks and link
 * cards (`card` looks up a URL's preview; without it every card is plain).
 * `math` says whether the page needs the KaTeX stylesheet.
 */
export function createBodyRenderer(resolve: (target: string) => { slug: string; target?: LinkTarget }, card: (url: string) => CardData = plainCard) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkLinkCards, { card })
    .use(remarkWikilinks, { resolve })
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeShiki, { theme: codeTheme, defaultLanguage: "text", fallbackLanguage: "text" })
    .use(rehypeStringify);

  return async (markdown: string): Promise<NoteBody> => {
    let math = false;
    visit(processor.parse(markdown), ["math", "inlineMath"], () => {
      math = true;
    });
    const html = String(await processor.process(markdown));
    return { html, math };
  };
}
