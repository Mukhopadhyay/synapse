/**
 * Builds the knowledge graph: content/<domain>/[<cluster>/]<slug>.md → public/graph.json.
 * parse → validate → wikilinks → resolve (ghosts) → check cycles → PageRank → d3-force layout → emit → bodies
 *
 * TODO (deferred from the vertical slice, see notes/plan.md M3–M4):
 * - Git dates and contributors per note, falling back to "unknown" on shallow clones
 * - Louvain communities as a fallback cluster for notes without a cluster folder
 * - Fixture tests in scripts/__fixtures__/ (cycle, ghost, duplicate slug, bad key) and `pnpm test`
 * - A --watch mode so `pnpm dev` redraws the map when a note is saved
 *
 * Bodies are rendered to HTML into .synapse/notes/<slug>.json, separate from graph.json so the
 * map payload stays small; /<domain>/graph/<slug> pages read them at build time.
 *
 * Link cards (a bare URL alone in a paragraph) take their previews from content/.link-previews.json;
 * links missing from it are fetched, and their images resized into --previews (served at /_previews).
 * A failed fetch is a warning and a plain card, never an error.
 *
 * The search index (MiniSearch, with body text) is written next to graph.json and loaded by the
 * palette the first time it opens.
 *
 * Usage: node scripts/build-graph.ts [--check] [--content <dir>] [--out <file>] [--bodies <dir>] [--search <file>] [--previews <dir>]
 *   --search defaults to search-index.json next to --out
 *   --check  validate only; nothing is written
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs, styleText } from "node:util";

import { SLIPBOX } from "../src/config/slipbox.ts";
import type { GraphData, GraphDomain, GraphNode } from "../src/lib/content/schema.ts";
import { GHOST_MIN_RADIUS, nodeRadius } from "../src/lib/graph/node-size.ts";
import { slipboxCards } from "../src/lib/graph/slipbox-cards.ts";
import { computeImportance } from "./lib/importance.ts";
import { computeLayout } from "./lib/layout.ts";
import { loadContent } from "./lib/load-content.ts";
import { cardLookup, collectCardRefs } from "./lib/link-previews/cards.ts";
import { plainCard, resolvePreviews } from "./lib/link-previews/index.ts";
import { createBodyRenderer } from "./lib/render-body.ts";
import { createReport, printReport } from "./lib/report.ts";
import { buildSearchIndex } from "./lib/search-index.ts";
import { bodyText } from "./lib/word-count.ts";
import { resolveGraph } from "./lib/resolve.ts";
import { checkAcyclic } from "./lib/validate.ts";

const { values: args } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    content: { type: "string", default: "content" },
    out: { type: "string", default: "public/graph.json" },
    bodies: { type: "string", default: ".synapse/notes" },
    search: { type: "string" },
    previews: { type: "string", default: "public/_previews" },
  },
});

const report = createReport();
const contentDir = path.resolve(args.content);

const { domains, notes } = await loadContent(contentDir, report);
const ghostTitles = new Map(
  domains.flatMap(({ id, file }) =>
    Object.entries(file.ghosts).map(([slug, title]) => [slug, { title, file: `content/${id}/_domain.yml` }] as const),
  ),
);
const { nodes: drafts, edges, files } = resolveGraph(notes, report, ghostTitles);
checkAcyclic(edges, files, report);

/* The landing page's slipbox files real notes, so only the repo's own content is held to it, not fixtures */
if (contentDir === path.resolve("content")) {
  for (const problem of slipboxCards({ nodes: drafts, edges }, SLIPBOX).problems) report.error("src/config/slipbox.ts", problem);
}

printReport(report);

const ghostCount = drafts.filter((node) => node.ghost).length;
const relationCount = edges.filter((edge) => edge.kind !== "mentions").length;
console.log(`\n${notes.length} notes, ${ghostCount} not written yet, ${relationCount} relations.`);

if (report.errors.length > 0) {
  const count = report.errors.length;
  console.log(styleText("red", `${count} ${count === 1 ? "error" : "errors"}. Fix ${count === 1 ? "it" : "them"} and run pnpm check again.`));
  process.exit(1);
}

if (args.check) {
  console.log(styleText("green", "Content is valid."));
  process.exit(0);
}

const ids = drafts.map((node) => node.id);
const importance = computeImportance(ids, edges);

const relationCounts = new Map<string, number>();
for (const { source, target, kind } of edges) {
  if (kind === "mentions") continue;
  relationCounts.set(source, (relationCounts.get(source) ?? 0) + 1);
  relationCounts.set(target, (relationCounts.get(target) ?? 0) + 1);
}

const positions = computeLayout(
  drafts.map((node) => {
    const size = nodeRadius(relationCounts.get(node.id) ?? 0);
    return { ...node, size: node.ghost ? Math.max(GHOST_MIN_RADIUS, size) : size };
  }),
  edges,
);

const graphNodes: GraphNode[] = drafts
  .map((node) => ({
    ...node,
    importance: node.ghost ? 0 : (importance.get(node.id) ?? 0),
    relationCount: relationCounts.get(node.id) ?? 0,
    ...positions.get(node.id)!,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const graphDomains: GraphDomain[] = domains.map(({ id, file }) => ({
  id,
  name: file.name,
  color: file.color,
  description: file.description,
  clusters: Object.entries(file.clusters).map(([clusterId, name]) => ({ id: clusterId, name })),
}));

const data: GraphData = {
  version: 1,
  template: await readFile(path.join(contentDir, "_templates/note.md"), "utf8").catch(() => ""),
  domains: graphDomains,
  nodes: graphNodes,
  edges: [...edges].sort((a, b) =>
    `${a.kind}:${a.source}:${a.target}`.localeCompare(`${b.kind}:${b.source}:${b.target}`),
  ),
};

const outFile = path.resolve(args.out);
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(data));
console.log(styleText("green", `Wrote ${path.relative(process.cwd(), outFile)}.`));

const searchFile = args.search ? path.resolve(args.search) : path.join(path.dirname(outFile), "search-index.json");
await writeFile(searchFile, buildSearchIndex(graphNodes, new Map(notes.map((note) => [note.slug, bodyText(note.body)]))));
console.log(styleText("green", `Wrote ${path.relative(process.cwd(), searchFile)}.`));

const previewReport = createReport();
const cards = await resolvePreviews(
  notes.flatMap((note) => collectCardRefs(note.body).map((ref) => ref.url)),
  {
    cacheFile: path.join(contentDir, ".link-previews.json"),
    imageDir: path.resolve(args.previews),
    publicPath: "/_previews",
    warn: (message) => previewReport.warn("link previews", message),
  },
);
printReport(previewReport);
if (cards.size > 0) console.log(styleText("green", `Prepared ${cards.size} link ${cards.size === 1 ? "card" : "cards"}.`));

const byId = new Map(graphNodes.map((node) => [node.id, node]));
const renderBody = createBodyRenderer((target) => {
  const slug = target.split("/").at(-1)!;
  const node = byId.get(slug);
  return { slug, target: node && { title: node.title, ghost: node.ghost, domain: node.domain } };
}, cardLookup(cards, plainCard));

const bodiesDir = path.resolve(args.bodies);
await rm(bodiesDir, { recursive: true, force: true });
await mkdir(bodiesDir, { recursive: true });
let mathNotes = 0;
for (const note of notes) {
  const body = await renderBody(note.body);
  if (body.math) mathNotes++;
  await writeFile(path.join(bodiesDir, `${note.slug}.json`), JSON.stringify(body));
}

const katexDir = path.resolve("public/vendor/katex");
await rm(katexDir, { recursive: true, force: true });
await cp(path.resolve("node_modules/katex/dist/katex.min.css"), path.join(katexDir, "katex.min.css"));
await cp(path.resolve("node_modules/katex/dist/fonts"), path.join(katexDir, "fonts"), { recursive: true });
console.log(styleText("green", `Rendered ${notes.length} note bodies (${mathNotes} with math).`));
