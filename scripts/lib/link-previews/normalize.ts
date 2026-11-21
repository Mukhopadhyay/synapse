import { createHash } from "node:crypto";

const TRACKING_PARAM = /^utm_/i;

/** The cache key for a link: http(s) only, no fragment, no utm_* tracking. Null for anything else. */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  url.hash = "";
  const tracking = [...url.searchParams.keys()].filter((key) => TRACKING_PARAM.test(key));
  for (const key of tracking) url.searchParams.delete(key);
  return url.href;
}

/** Names a link's generated image files. */
export const urlHash = (key: string) => createHash("sha1").update(key).digest("hex");

/** "www.anthropic.com" → "anthropic.com". */
export const displayDomain = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** The fallback title for a link without metadata: its path, or the domain for a bare origin. */
export function pathTitle(url: string) {
  const { pathname, search } = new URL(url);
  const path = decodeURIComponent(pathname + search);
  return path === "/" ? displayDomain(url) : path;
}
