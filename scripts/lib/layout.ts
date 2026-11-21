import type { GraphEdge } from "../../src/lib/content/schema.ts";
import { createForceSimulation, runToRest, type SimLink, type SimNode } from "../../src/lib/graph/forces.ts";

const SEED = 0x5ca1ab1e;
/** Clusters start on a circle this far from the middle; the forces take it from there. */
const START_RADIUS = 160;
const START_SPREAD = 60;

/** mulberry32: a tiny seeded PRNG so every build starts from the same positions. */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type LayoutNode = { id: string; domain: string; cluster?: string; size: number };

export const groupOf = (node: { domain: string; cluster?: string }) => `${node.domain}/${node.cluster ?? ""}`;

/**
 * Lays the graph out with the same forces and defaults the live map uses (src/lib/graph/forces.ts),
 * from seeded start positions, so every build gives the same layout and the map loads at rest.
 * Each cluster starts around its own point on a circle; the cluster force keeps it together.
 */
export function computeLayout(nodes: LayoutNode[], edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const random = seededRandom(SEED);
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const groups = [...new Set(sorted.map(groupOf))].sort();

  const simNodes: SimNode[] = sorted.map((node) => {
    const angle = (2 * Math.PI * groups.indexOf(groupOf(node))) / groups.length;
    return {
      id: node.id,
      radius: node.size,
      group: groupOf(node),
      x: Math.cos(angle) * START_RADIUS + (random() - 0.5) * START_SPREAD,
      y: Math.sin(angle) * START_RADIUS + (random() - 0.5) * START_SPREAD,
    };
  });
  const links: SimLink[] = edges
    .filter((edge) => edge.kind !== "mentions")
    .map(({ source, target }) => ({ source, target }))
    .sort((a, b) => `${a.source}${a.target}`.localeCompare(`${b.source}${b.target}`));

  const simulation = createForceSimulation(simNodes, links);
  runToRest(simulation);

  const round = (value: number) => Math.round(value * 100) / 100;
  return new Map(simNodes.map((node) => [node.id, { x: round(node.x ?? 0), y: round(node.y ?? 0) }]));
}
