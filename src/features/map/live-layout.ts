import { useSettingsStore } from "@/features/settings/settings-store";
import {
  applyForces,
  createForceSimulation,
  refreshCollide,
  runToRest,
  setLinks,
  SETTLE_ALPHA,
  SETTLE_DECAY,
  type SimLink,
  type SimNode,
} from "@/lib/graph/forces";
import { prefersReducedMotion } from "@/lib/motion";

/** A label pill's box relative to its node's centre, in graph units. */
export type LabelGuard = { id: string; left: number; top: number; width: number; height: number };

const GUARD_PADDING = 2;
const GUARD_STRENGTH = 0.4;

/** Pushes other nodes vertically out of pinned label pills while the graph settles. */
function labelGuardForce(guards: () => LabelGuard[], byId: Map<string, SimNode>, nodes: SimNode[]) {
  return () => {
    for (const guard of guards()) {
      const owner = byId.get(guard.id);
      if (!owner) continue;
      const left = (owner.x ?? 0) + guard.left;
      const top = (owner.y ?? 0) + guard.top;
      for (const node of nodes) {
        if (node === owner || node.fx != null) continue;
        const pad = node.radius + GUARD_PADDING;
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        if (x < left - pad || x > left + guard.width + pad || y < top - pad || y > top + guard.height + pad) continue;
        const above = top - pad;
        const below = top + guard.height + pad;
        const target = y - above < below - y ? above : below;
        node.vy = (node.vy ?? 0) + (target - y) * GUARD_STRENGTH;
      }
    }
  };
}

export type LayoutInput = {
  nodes: { id: string; x: number; y: number; radius: number; group: string }[];
  links: { source: string; target: string }[];
};

/**
 * The live force simulation. It starts from the build's positions with low energy, so the graph
 * settles in about a second, then stops: no ticks and no redraws until something wakes it
 * (a drag or a force change). The map's frame loop calls `step`; d3's own timer is never used.
 * Under reduced motion, settling happens off-screen in one go.
 */
export function createLiveLayout(input: LayoutInput) {
  const baseRadius = new Map(input.nodes.map((node) => [node.id, node.radius]));
  const nodes: SimNode[] = input.nodes.map((node) => ({ ...node }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links: SimLink[] = input.links.map((link) => ({ ...link }));
  const reduced = prefersReducedMotion();

  const { forces, display } = useSettingsStore.getState();
  for (const node of nodes) node.radius = baseRadius.get(node.id)! * display.nodeSize;
  let guards: LabelGuard[] = [];
  const simulation = createForceSimulation(nodes, links, forces)
    .alphaDecay(SETTLE_DECAY)
    .force("labels", labelGuardForce(() => guards, byId, nodes));
  let dragging: SimNode | null = null;
  /** Pill guards only apply once someone has dragged: the load settle must not depend on the selection, zoom or window size. */
  let dragged = false;

  function wake() {
    simulation.alpha(Math.max(simulation.alpha(), SETTLE_ALPHA));
    if (reduced && !dragging) runToRest(simulation);
  }

  wake();

  return {
    /** Follows force and node-size settings until the returned cleanup runs. */
    start(onWake: () => void) {
      return useSettingsStore.subscribe((state, previous) => {
        if (state.forces !== previous.forces) {
          applyForces(simulation, state.forces);
          wake();
          onWake();
        }
        if (state.display.nodeSize !== previous.display.nodeSize) {
          for (const node of nodes) node.radius = baseRadius.get(node.id)! * state.display.nodeSize;
          refreshCollide(simulation);
          wake();
          onWake();
        }
      });
    },
    /** Advances one tick if the graph is still moving. Returns whether anything moved. */
    step() {
      if (!dragging && simulation.alpha() < simulation.alphaMin()) return false;
      simulation.tick();
      return true;
    },
    isMoving: () => dragging !== null || simulation.alpha() >= simulation.alphaMin(),
    position: (id: string) => byId.get(id),
    forEach: (callback: (node: SimNode) => void) => nodes.forEach(callback),
    radius: (id: string) => byId.get(id)?.radius ?? 0,
    /** Adds nodes (tags as nodes) and their links, then lets the graph settle around them. */
    add(extra: LayoutInput) {
      for (const node of extra.nodes) {
        baseRadius.set(node.id, node.radius);
        const simNode: SimNode = { ...node, radius: node.radius * useSettingsStore.getState().display.nodeSize };
        nodes.push(simNode);
        byId.set(node.id, simNode);
      }
      links.push(...extra.links.map((link) => ({ ...link })));
      simulation.nodes(nodes);
      setLinks(simulation, links, useSettingsStore.getState().forces);
      wake();
    },
    /** Removes nodes and every link touching them. */
    remove(ids: Set<string>) {
      const keep = (node: SimNode) => !ids.has(node.id);
      nodes.splice(0, nodes.length, ...nodes.filter(keep));
      const endId = (end: string | SimNode) => (typeof end === "string" ? end : end.id);
      links.splice(0, links.length, ...links.filter((link) => !ids.has(endId(link.source)) && !ids.has(endId(link.target))));
      ids.forEach((id) => byId.delete(id));
      simulation.nodes(nodes);
      setLinks(simulation, links, useSettingsStore.getState().forces);
      wake();
    },
    /** Pinned label pills, refreshed each frame; only read while the graph is moving. */
    guardLabels(next: LabelGuard[]) {
      guards = dragged ? next : [];
    },
    /** Pins a node to the pointer and keeps the simulation warm while it moves. */
    dragStart(id: string) {
      const node = byId.get(id);
      if (!node) return;
      dragging = node;
      dragged = true;
      node.fx = node.x;
      node.fy = node.y;
      simulation.alphaTarget(SETTLE_ALPHA);
      simulation.alpha(Math.max(simulation.alpha(), SETTLE_ALPHA));
    },
    dragTo(x: number, y: number) {
      if (!dragging) return;
      dragging.fx = x;
      dragging.fy = y;
    },
    /** Lets go: the node rejoins the simulation, which cools down and stops. */
    dragEnd() {
      if (!dragging) return;
      dragging.fx = null;
      dragging.fy = null;
      dragging = null;
      simulation.alphaTarget(0);
      if (reduced) runToRest(simulation);
    },
  };
}

export type LiveLayout = ReturnType<typeof createLiveLayout>;
