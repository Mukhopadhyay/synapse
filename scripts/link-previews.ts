/**
 * Refreshes link-card previews: `pnpm previews` refetches every card link in content/ (and drops
 * cache entries no note uses any more); `pnpm previews --url <url>` refetches just that one.
 * Writes content/.link-previews.json (commit it) and the images in public/_previews (generated).
 *
 * Usage: node scripts/link-previews.ts [--url <url>] [--content <dir>] [--previews <dir>]
 */
import path from "node:path";
import { parseArgs, styleText } from "node:util";

import { collectCardRefs } from "./lib/link-previews/cards.ts";
import { resolvePreviews } from "./lib/link-previews/index.ts";
import { normalizeUrl } from "./lib/link-previews/normalize.ts";
import { loadContent } from "./lib/load-content.ts";
import { createReport, printReport } from "./lib/report.ts";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    content: { type: "string", default: "content" },
    previews: { type: "string", default: "public/_previews" },
  },
});

const contentDir = path.resolve(args.content);
const report = createReport();
const only = args.url === undefined ? null : normalizeUrl(args.url);
if (args.url !== undefined && !only) {
  console.log(styleText("red", `"${args.url}" isn't an http(s) link.`));
  process.exit(1);
}

const urls = only ? [only] : (await loadContent(contentDir, createReport())).notes.flatMap((note) => collectCardRefs(note.body).map((ref) => ref.url));
const cards = await resolvePreviews(urls, {
  cacheFile: path.join(contentDir, ".link-previews.json"),
  imageDir: path.resolve(args.previews),
  publicPath: "/_previews",
  refresh: only ? new Set([only]) : "all",
  prune: !only,
  warn: (message) => report.warn("link previews", message),
});
printReport(report);

for (const card of cards.values()) console.log(`${styleText("bold", card.domain)}  ${card.title}`);
console.log(styleText(report.warnings.length ? "yellow" : "green", `Refreshed ${cards.size} link ${cards.size === 1 ? "preview" : "previews"}.`));
