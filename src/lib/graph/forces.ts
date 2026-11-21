import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Force,
  type ForceLink,
  type ForceManyBody,
  type ForceX,
  type ForceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

/**
 * The graph's physics, shared by the build script (which lays the graph out once) and the map
 * (which keeps it live). Both use the same forces with the same defaults, so the positions in
 * graph.json are already where the live simulation would settle, and loading looks calm.
 */

/** Obsidian's four force sliders. */
export type ForceSettings = {
  /** How strongly everything is pulled to the middle; higher gives a rounder, more compact graph. */
  center: number;
  /** How hard nodes push each other apart. */
  repel: number;
  /** How tight links are, like rubber bands. */
  link: number;
  /** The length each link tries to keep, in graph units (px at zoom 1). */
  distance: number;
};

export const FORCE_DEFAULTS: ForceSettings = { center: 0.5, repel: 10, link: 1, distance: 70 };

export const FORCE_RANGES: Record<keyof ForceSettings, { min: number; max: number; step: number }> = {
  center: { min: 0, max: 1, step: 0.01 },
  repel: { min: 0, max: 20, step: 0.1 },
  link: { min: 0, max: 1, step: 0.01 },
  distance: { min: 20, max: 300, step: 1 },
};

const CENTER_SCALE = 0.1;
const REPEL_SCALE = 25;
const REPEL_RANGE = 800;
/** Keeps notes of one cluster together, so clusters read as groups without a slider. */
const CLUSTER_STRENGTH = 0.12;
const COLLIDE_PADDING = 3;

/** Alpha a gentle start or a release begins from, and the decay that takes it to rest in ~72 ticks (1.2s). */
export const SETTLE_ALPHA = 0.3;
export const SETTLE_DECAY = 0.076;
/** Ticks the build runs from scratch. */
const LAYOUT_TICKS = 400;

export type SimNode = SimulationNodeDatum & { id: string; radius: number; group: string };
export type SimLink = SimulationLinkDatum<SimNode> & { source: string | SimNode; target: string | SimNode };
export type ForceSimulation = Simulation<SimNode, SimLink>;

/** Pulls each node a little towards its group's current centre. */
function clusterForce(strength: number): Force<SimNode, SimLink> {
  let nodes: SimNode[] = [];
  const force = (alpha: number) => {
    const sums = new Map<string, { x: number; y: number; count: number }>();
    for (const node of nodes) {
      const sum = sums.get(node.group) ?? { x: 0, y: 0, count: 0 };
      sum.x += node.x ?? 0;
      sum.y += node.y ?? 0;
      sum.count += 1;
      sums.set(node.group, sum);
    }
    for (const node of nodes) {
      const sum = sums.get(node.group)!;
      if (sum.count < 2) continue;
      node.vx = (node.vx ?? 0) + (sum.x / sum.count - (node.x ?? 0)) * strength * alpha;
      node.vy = (node.vy ?? 0) + (sum.y / sum.count - (node.y ?? 0)) * strength * alpha;
    }
  };
  force.initialize = (next: SimNode[]) => {
    nodes = next;
  };
  return force;
}

const endId = (end: string | SimNode) => (typeof end === "string" ? end : end.id);

/** d3's default link strength (1 / the busier end's link count), scaled by the Link force slider. */
function linkStrength(links: SimLink[], scale: number) {
  const counts = new Map<string, number>();
  for (const { source, target } of links) {
    counts.set(endId(source), (counts.get(endId(source)) ?? 0) + 1);
    counts.set(endId(target), (counts.get(endId(target)) ?? 0) + 1);
  }
  return (link: SimLink) =>
    scale / Math.min(counts.get(endId(link.source)) ?? 1, counts.get(endId(link.target)) ?? 1);
}

/** Applies slider values to a running simulation; the caller decides whether to reheat it. */
export function applyForces(simulation: ForceSimulation, settings: ForceSettings) {
  const link = simulation.force("link") as ForceLink<SimNode, SimLink>;
  link.distance(settings.distance).strength(linkStrength(link.links(), settings.link));
  (simulation.force("charge") as ForceManyBody<SimNode>).strength(-settings.repel * REPEL_SCALE);
  (simulation.force("x") as ForceX<SimNode>).strength(settings.center * CENTER_SCALE);
  (simulation.force("y") as ForceY<SimNode>).strength(settings.center * CENTER_SCALE);
}

/** Replaces the links (after a filter change), keeping the slider values. */
export function setLinks(simulation: ForceSimulation, links: SimLink[], settings: ForceSettings) {
  (simulation.force("link") as ForceLink<SimNode, SimLink>).links(links);
  applyForces(simulation, settings);
}

/** Re-reads node radii after a node-size change. */
export function refreshCollide(simulation: ForceSimulation) {
  (simulation.force("collide") as ReturnType<typeof forceCollide<SimNode>>).radius((node) => node.radius + COLLIDE_PADDING);
}

/** A stopped simulation: the caller ticks it, from the build loop or from the map's frame loop. */
export function createForceSimulation(nodes: SimNode[], links: SimLink[], settings: ForceSettings = FORCE_DEFAULTS) {
  const simulation: ForceSimulation = forceSimulation(nodes)
    .stop()
    .force("link", forceLink<SimNode, SimLink>(links).id((node) => node.id))
    .force("charge", forceManyBody<SimNode>().distanceMax(REPEL_RANGE))
    .force("x", forceX<SimNode>(0))
    .force("y", forceY<SimNode>(0))
    .force("collide", forceCollide<SimNode>((node) => node.radius + COLLIDE_PADDING))
    .force("cluster", clusterForce(CLUSTER_STRENGTH));
  applyForces(simulation, settings);
  return simulation;
}

/** Runs a simulation to rest without drawing; for the build and for reduced motion. */
export function runToRest(simulation: ForceSimulation, ticks = LAYOUT_TICKS) {
  for (let tick = 0; tick < ticks && simulation.alpha() > simulation.alphaMin(); tick++) simulation.tick();
}
