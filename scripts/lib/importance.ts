import { DirectedGraph } from "graphology";
import pagerank from "graphology-metrics/centrality/pagerank.js";

import type { GraphEdge } from "../../src/lib/content/schema.ts";

/**
 * PageRank over `requires` edges, normalised to 0–1. Rank flows from a note to what it
 * requires, so foundational concepts come out large.
 */
export function computeImportance(nodeIds: string[], edges: GraphEdge[]): Map<string, number> {
  const graph = new DirectedGraph();
  for (const id of nodeIds) graph.addNode(id);
  for (const { source, target, kind } of edges) {
    if (kind === "requires" && !graph.hasEdge(source, target)) graph.addEdge(source, target);
  }

  const ranks: Record<string, number> = graph.size > 0 ? pagerank(graph, { getEdgeWeight: null }) : {};
  const values = nodeIds.map((id) => ranks[id] ?? 0);
  const min = Math.min(...values);
  const span = Math.max(...values) - min;

  return new Map(nodeIds.map((id) => [id, span > 0 ? Number((((ranks[id] ?? 0) - min) / span).toFixed(4)) : 0]));
}
