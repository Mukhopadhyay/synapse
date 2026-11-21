import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import type { MdastRoot } from "../wikilinks.ts";
import { normalizeUrl } from "./normalize.ts";
import type { CardData } from "./index.ts";

/** A card in a note: its URL as written, and whether it was marked large with a leading "!". */
export type CardRef = { url: string; large: boolean };

type MdastBlock = MdastRoot["children"][number];
type HastProperties = Record<string, string | number | boolean | string[]>;
type HastChild = { type: "element"; tagName: string; properties: HastProperties; children: HastChild[] } | { type: "text"; value: string };

const LARGE = /^!(https?:\/\/\S+)$/;
const parser = unified().use(remarkParse).use(remarkGfm);
const isHttp = (url: string) => /^https?:\/\//i.test(url);

/**
 * A paragraph at the top level of a note that holds nothing but a URL becomes a card: a bare URL
 * is compact, "!" right before it makes it large. URLs inside sentences, lists or quotes stay links.
 */
export function cardRef(block: MdastBlock): CardRef | null {
  if (block.type !== "paragraph") return null;
  const [first, second, ...rest] = block.children;
  if (rest.length > 0 || !first) return null;
  const bareLink = (node: typeof first | undefined) =>
    node?.type === "link" && node.children.length === 1 && node.children[0].type === "text" && node.children[0].value === node.url && isHttp(node.url)
      ? node.url
      : null;

  if (!second) {
    const url = bareLink(first);
    if (url) return { url, large: false };
    const large = first.type === "text" ? LARGE.exec(first.value.trim()) : null;
    return large ? { url: large[1], large: true } : null;
  }
  if (first.type === "text" && first.value.trim() === "!") {
    const url = bareLink(second);
    return url ? { url, large: true } : null;
  }
  return null;
}

/** Every card in a note body, for fetching previews before rendering. */
export function collectCardRefs(markdown: string): CardRef[] {
  return parser
    .parse(markdown)
    .children.map(cardRef)
    .filter((ref) => ref !== null);
}

const element = (tagName: string, properties: HastProperties, children: HastChild[] = []): HastChild => ({ type: "element", tagName, properties, children });
const text = (value: string): HastChild => ({ type: "text", value });

/** lucide's arrow-up-right, inlined because note bodies are static HTML. */
const arrow = element(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: ["lucide", "link-card-arrow"],
    ariaHidden: "true",
  },
  [element("path", { d: "M7 7h10v10" }), element("path", { d: "M7 17 17 7" })],
);

/** The card as HTML: one external link holding the site row, title, description and image. Large cards without an image fall back to compact. */
export function cardElement(card: CardData, large: boolean): HastChild {
  const image = large ? card.image : null;
  const favicon = card.favicon
    ? element("span", { className: ["link-card-favicon"] }, [element("img", { src: card.favicon, alt: "", width: 16, height: 16, loading: "lazy", decoding: "async" })])
    : element("span", { className: ["link-card-favicon"], ariaHidden: "true" }, [text(card.domain.charAt(0))]);
  const body = element("span", { className: ["link-card-body"] }, [
    element("span", { className: ["link-card-site"] }, [favicon, element("span", { className: ["link-card-domain"] }, [text(card.domain)]), arrow]),
    element("span", { className: ["link-card-title"] }, [text(card.title)]),
    ...(card.description ? [element("span", { className: ["link-card-description"] }, [text(card.description)])] : []),
  ]);
  const link = { href: card.href, target: "_blank", rel: ["noopener", "noreferrer"] };

  if (image) {
    return element("a", { ...link, className: ["link-card", "link-card-large"] }, [
      element("img", {
        className: ["link-card-image"],
        src: image.src800,
        srcSet: `${image.src400} 400w, ${image.src800} 800w`,
        sizes: "(min-width: 640px) 440px, 100vw",
        alt: "",
        width: 1200,
        height: 630,
        loading: "lazy",
        decoding: "async",
      }),
      body,
    ]);
  }
  const thumb = card.thumb ? [element("img", { className: ["link-card-thumb"], src: card.thumb, alt: "", width: 72, height: 72, loading: "lazy", decoding: "async" })] : [];
  return element("a", { ...link, className: ["link-card"] }, [body, ...thumb]);
}

/** Replaces card paragraphs with card HTML. `card(url)` looks up the preview (or a plain card) for a URL as written. */
export function remarkLinkCards(options: { card: (url: string) => CardData }) {
  return (tree: MdastRoot) => {
    tree.children = tree.children.map((block) => {
      const ref = cardRef(block);
      if (!ref) return block;
      const { tagName, properties, children } = cardElement({ ...options.card(ref.url), href: ref.url }, ref.large) as Extract<HastChild, { type: "element" }>;
      return { type: "linkCard", data: { hName: tagName, hProperties: properties, hChildren: children } } as unknown as MdastBlock;
    });
  };
}

/** The lookup `remarkLinkCards` needs, from resolved previews keyed by normalised URL. */
export function cardLookup(cards: Map<string, CardData>, plain: (href: string) => CardData) {
  return (url: string) => cards.get(normalizeUrl(url) ?? url) ?? plain(url);
}
