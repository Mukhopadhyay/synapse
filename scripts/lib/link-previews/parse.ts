import { fromHtml } from "hast-util-from-html";

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 300;

type HastRoot = ReturnType<typeof fromHtml>;
type HastNode = HastRoot | HastRoot["children"][number];
type HastElement = Extract<HastNode, { type: "element" }>;

export type PageMetadata = {
  title: string;
  description: string;
  /** og:site_name, else empty. */
  siteName: string;
  /** Absolute http(s) URL with the sizes the page declares, if any. */
  image: { src: string; width: number | null; height: number | null } | null;
  /** Icon candidates, most usable first (SVG and PNG before ICO, bigger before smaller). */
  favicons: string[];
};

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((child) => textOf(child as HastNode)).join("");
  return "";
}

/** Strips tags, decodes entities, collapses whitespace and caps the length with an ellipsis. */
export function cleanText(value: string, max: number) {
  const text = textOf(fromHtml(value, { fragment: true })).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function absolute(href: string | undefined, base: string) {
  if (!href) return null;
  try {
    const url = new URL(href.trim(), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const tokens = (value: unknown) => (Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(/\s+/) : []).map((token) => token.toLowerCase());

function iconRank(type: string, href: string, sizes: string[]) {
  const format = /svg/.test(type) || /\.svg(\?|$)/i.test(href) ? 3 : /png/.test(type) || /\.png(\?|$)/i.test(href) ? 2 : /icon|\.ico(\?|$)/i.test(type + href) ? 0 : 1;
  const size = Math.max(0, ...sizes.map((value) => Number.parseInt(value, 10) || 0));
  return format * 1000 + Math.min(size, 512);
}

function findHead(node: HastNode): HastElement | null {
  if (node.type === "element" && node.tagName === "head") return node;
  if (!("children" in node)) return null;
  for (const child of node.children) {
    const head = findHead(child as HastNode);
    if (head) return head;
  }
  return null;
}

/**
 * Reads a page's preview metadata in this order: og:*, then twitter:*, then <title> and
 * meta[name=description]; icons from link[rel~=icon], then apple-touch-icon.
 */
export function parseMetadata(html: string, pageUrl: string): PageMetadata {
  const tree = fromHtml(html);
  const head = findHead(tree) ?? tree;
  const meta = new Map<string, string>();
  let titleTag = "";
  const icons: { href: string; rank: number; touch: boolean }[] = [];

  const walk = (node: HastNode) => {
    if (node.type === "element") {
      const { properties } = node;
      if (node.tagName === "meta") {
        const key = String(properties.property ?? properties.name ?? "").toLowerCase();
        const content = properties.content;
        if (key && typeof content === "string" && content.trim() && !meta.has(key)) meta.set(key, content);
      } else if (node.tagName === "title" && !titleTag) {
        titleTag = textOf(node);
      } else if (node.tagName === "link") {
        const rel = tokens(properties.rel);
        const href = absolute(typeof properties.href === "string" ? properties.href : undefined, pageUrl);
        const touch = rel.includes("apple-touch-icon");
        if (href && (rel.includes("icon") || touch)) {
          icons.push({ href, touch, rank: iconRank(String(properties.type ?? ""), href, tokens(properties.sizes)) });
        }
      }
    }
    if ("children" in node) node.children.forEach((child) => walk(child as HastNode));
  };
  walk(head);

  const first = (...keys: string[]) => keys.map((key) => meta.get(key)).find((value) => value !== undefined) ?? "";
  const imageSrc = absolute(first("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"), pageUrl);
  const dimension = (key: string) => {
    const value = Number.parseInt(meta.get(key) ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  return {
    title: cleanText(first("og:title", "twitter:title") || titleTag, TITLE_MAX),
    description: cleanText(first("og:description", "twitter:description", "description"), DESCRIPTION_MAX),
    siteName: cleanText(first("og:site_name"), TITLE_MAX),
    image: imageSrc ? { src: imageSrc, width: dimension("og:image:width"), height: dimension("og:image:height") } : null,
    favicons: [
      ...icons.filter((icon) => !icon.touch).sort((a, b) => b.rank - a.rank),
      ...icons.filter((icon) => icon.touch),
    ].map((icon) => icon.href),
  };
}
