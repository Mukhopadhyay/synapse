/**
 * Routes: `/` is the landing page and `/graph` the all-fields map. `/<domain>/graph` is a field's map and `/<domain>/list` its list; a note opens over
 * either as `/<domain>/graph/<slug>` or `/<domain>/list/<slug>`. The graph URL is a note's canonical address.
 */

export type View = "graph" | "list";

export const ALL_FIELDS_HREF = "/graph";

const trimPath = (pathname: string | null) => pathname?.replace(/(\.html|\/)$/, "") ?? "";

export function isAllFieldsPath(pathname: string | null) {
  return trimPath(pathname) === ALL_FIELDS_HREF;
}

export const viewHref = (domain: string, view: View) => `/${domain}/${view}`;

export const graphHref = (domain: string) => viewHref(domain, "graph");

export const listHref = (domain: string) => viewHref(domain, "list");

export const noteHref = (domain: string, id: string, view: View = "graph") => `${viewHref(domain, view)}/${id}`;

export type GraphRoute = { domain: string; view: View; slug: string | null };

const VIEW_PATH = /^\/([^/]+)\/(graph|list)(?:\/([^/]+?))?(?:\.html)?\/?$/;

/** `/ai/graph` → { domain: "ai", view: "graph", slug: null }; `/ai/list/attention` → { domain: "ai", view: "list", slug: "attention" }. */
export function parseGraphPath(pathname: string | null): GraphRoute | null {
  const match = pathname?.match(VIEW_PATH);
  if (!match) return null;
  return { domain: decodeURIComponent(match[1]), view: match[2] as View, slug: match[3] ? decodeURIComponent(match[3]) : null };
}

export function slugFromPath(pathname: string | null): string | null {
  return parseGraphPath(pathname)?.slug ?? null;
}

/** Routes that are documents (scrolling pages over a hidden map) rather than map or list views. */
const DOCUMENT_PATHS = ["/contribute"];

export function isDocumentPath(pathname: string | null) {
  return DOCUMENT_PATHS.includes(trimPath(pathname));
}
