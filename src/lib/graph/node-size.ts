/**
 * Node radius in graph units (px at zoom 1) from its link count, both directions, mentions excluded:
 * 3 + 2.2 × links^0.85, capped at 16. Steep enough that a busy note reads as a hub at a glance, and
 * absolute rather than relative to the busiest node, so a note keeps its size as the graph grows.
 * 1 link → 5.2, 2 → 7, 4 → 10.2, 8 → 15, 9+ → 16.
 */
export function nodeRadius(links: number) {
  return Math.min(16, 3 + 2.2 * Math.max(0, links) ** 0.85);
}

/** Ghost rings are never smaller than this, so they read as rings rather than specks. */
export const GHOST_MIN_RADIUS = 6;

/** Links on the map (mentions included) that make a note a hub: a breathing halo and a bolder label. */
export const HUB_LINKS = 5;

/** 0 for a note with two links or fewer, 1 for a hub; drives label contrast. */
export function prominence(links: number) {
  return Math.min(1, Math.max(0, (links - 2) / (HUB_LINKS - 2)));
}
