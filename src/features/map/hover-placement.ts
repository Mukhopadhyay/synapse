/** Where the hover card goes: the spot next to the hovered node that hides the least of its neighbours. */

export type HoverSide = "right" | "left" | "below" | "above";
export type Rect = { left: number; top: number; width: number; height: number };
/** A neighbour as the box of its dot and, when it shows one, its label. */
export type Neighbour = { dot: Rect; label: Rect | null };

export type HoverPlacementInput = {
  /** The hovered node's centre and drawn radius, in viewport px. */
  node: { x: number; y: number; radius: number };
  card: { width: number; height: number };
  viewport: { width: number; height: number };
  /** What the card should keep clear of. */
  neighbours: Neighbour[];
  /** Space between the node and the card, and between the card and the viewport's edges. */
  gap: number;
  /** The card's top never goes above this (clear of the top bar). */
  minTop: number;
};

export type HoverPlacement = { left: number; top: number; side: HoverSide };

/** Tried in this order; on a tie the earlier side wins. */
export const HOVER_SIDES: HoverSide[] = ["right", "left", "below", "above"];
/** A hidden dot loses the neighbour altogether; a clipped label still reads. */
const DOT_WEIGHT = 3;
/** Covering the hovered node itself is worse than covering any neighbour. */
const SELF_WEIGHT = 6;

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(Math.max(low, high), value));

/**
 * The card's boxes on one side of the node, before they're kept on screen: centred on the node
 * first, then sliding so the node sits at either end of that side.
 */
function candidates(side: HoverSide, { node, card, gap }: HoverPlacementInput): Rect[] {
  const reach = node.radius + gap;
  const { x, y, radius } = node;
  const { width, height } = card;
  if (side === "right" || side === "left") {
    const left = side === "right" ? x + reach : x - reach - width;
    return [y - height / 2, y - radius, y + radius - height].map((top) => ({ left, top, width, height }));
  }
  const top = side === "below" ? y + reach : y - reach - height;
  return [x - width / 2, x - radius, x + radius - width].map((left) => ({ left, top, width, height }));
}

/**
 * Tries the card right, left, below and above the node (centred, then slid either way), keeps each
 * inside the viewport, and picks the one covering the least of the neighbours: their dots count
 * more than their labels, and the hovered node itself most of all.
 */
export function placeHoverCard(input: HoverPlacementInput): HoverPlacement {
  const { node, card, viewport, neighbours, gap, minTop } = input;
  const self: Rect = { left: node.x - node.radius, top: node.y - node.radius, width: node.radius * 2, height: node.radius * 2 };
  let best: (HoverPlacement & { cost: number }) | null = null;
  for (const side of HOVER_SIDES) {
    for (const raw of candidates(side, input)) {
      const box = {
        ...raw,
        left: clamp(raw.left, gap, viewport.width - gap - card.width),
        top: clamp(raw.top, minTop, viewport.height - gap - card.height),
      };
      const cost =
        neighbours.reduce((sum, { dot, label }) => sum + DOT_WEIGHT * overlap(box, dot) + (label ? overlap(box, label) : 0), 0) +
        SELF_WEIGHT * overlap(box, self);
      if (!best || cost < best.cost) best = { left: box.left, top: box.top, side, cost };
    }
  }
  const { left, top, side } = best!;
  return { left, top, side };
}
