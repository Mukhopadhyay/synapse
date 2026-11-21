/**
 * Writes public/graph.stress.json: a synthetic graph (default 500 notes, 1,500 relations) laid out
 * with the real layout, for checking map performance at scale. Open /ai/graph?graph=stress in dev.
 *
 * Usage: node scripts/generate-stress-graph.ts [--nodes 500] [--edges 1500]
 */
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import type { EdgeKind, GraphData, GraphEdge, GraphNode } from "../src/lib/content/schema.ts";
import { GHOST_MIN_RADIUS, nodeRadius } from "../src/lib/graph/node-size.ts";
import { computeLayout } from "./lib/layout.ts";

const { values: args } = parseArgs({
  options: { nodes: { type: "string", default: "500" }, edges: { type: "string", default: "1500" } },
});
const nodeCount = Number(args.nodes);
const edgeCount = Number(args.edges);

let state = 42;
const random = () => {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 4294967296;
};

const real: GraphData = JSON.parse(await readFile("public/graph.json", "utf8"));
const domain = real.domains[0];
const clusters = domain.clusters.map((cluster) => cluster.id);
const kinds: EdgeKind[] = ["requires", "requires", "extends", "related", "contrasts"];
const levels = ["foundational", "intermediate", "advanced"] as const;

const drafts = Array.from({ length: nodeCount }, (_, index) => ({
  id: `stress-${index}`,
  title: `Stress concept ${index}`,
  tags: [],
  aliases: [],
  domain: domain.id,
  cluster: clusters[index % clusters.length],
  ghost: random() < 0.08,
  stub: random() < 0.5,
  level: levels[index % 3],
}));

const edges: GraphEdge[] = [];
const seen = new Set<string>();
while (edges.length < edgeCount) {
  const a = Math.floor(random() * nodeCount);
  const sameCluster = random() < 0.7;
  let b = Math.floor(random() * nodeCount);
  if (sameCluster) b = (a + clusters.length * (1 + Math.floor(random() * 20))) % nodeCount;
  const [source, target] = a < b ? [a, b] : [b, a];
  const key = `${source}:${target}`;
  if (source === target || seen.has(key)) continue;
  seen.add(key);
  edges.push({ source: `stress-${target}`, target: `stress-${source}`, kind: kinds[Math.floor(random() * kinds.length)] });
}

const degree = new Map<string, number>();
for (const { source, target } of edges) {
  degree.set(source, (degree.get(source) ?? 0) + 1);
  degree.set(target, (degree.get(target) ?? 0) + 1);
}

const started = performance.now();
const positions = computeLayout(
  drafts.map((node) => {
    const size = nodeRadius(degree.get(node.id) ?? 0);
    return { ...node, size: node.ghost ? Math.max(GHOST_MIN_RADIUS, size) : size };
  }),
  edges,
);
console.log(`Layout of ${nodeCount} nodes, ${edgeCount} edges: ${Math.round(performance.now() - started)}ms`);

const nodes: GraphNode[] = drafts.map((node) => ({
  ...node,
  importance: 0,
  relationCount: degree.get(node.id) ?? 0,
  ...positions.get(node.id)!,
}));

await writeFile("public/graph.stress.json", JSON.stringify({ ...real, nodes, edges } satisfies GraphData));
console.log("Wrote public/graph.stress.json");
