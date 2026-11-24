/**
 * Floating chrome over the map (welcome card, legend, controls, graph settings) as plain boxes, so
 * fitting and label placement can keep the graph clear of them.
 */

export type OverlayCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** An overlay as the corner it hugs, its distance from those two edges and its size, in px. */
export type MapOverlay = { corner: OverlayCorner; x: number; y: number; width: number; height: number };

export type Sides = { top: number; right: number; bottom: number; left: number };
export type Box = { left: number; top: number; width: number; height: number };
/** Screen taken by the note panel: right on tablet and desktop, bottom on phones. */
export type PanelInsets = { right: number; bottom: number };

export const NO_SIDES: Sides = { top: 0, right: 0, bottom: 0, left: 0 };

const visible = (overlay: MapOverlay) => overlay.width > 0 && overlay.height > 0;
const hugsRight = (corner: OverlayCorner) => corner.endsWith("right");
const hugsBottom = (corner: OverlayCorner) => corner.startsWith("bottom");

/** Reads an element's corner and size from its layout box inside a parent of `parent` size (transforms ignored). */
export function overlayFromLayout(layout: Box, parent: { width: number; height: number }): MapOverlay {
  const right = parent.width - layout.left - layout.width;
  const bottom = parent.height - layout.top - layout.height;
  const horizontal = right < layout.left ? "right" : "left";
  const vertical = bottom < layout.top ? "bottom" : "top";
  return {
    corner: `${vertical}-${horizontal}`,
    x: Math.round(horizontal === "right" ? right : layout.left),
    y: Math.round(vertical === "bottom" ? bottom : layout.top),
    width: Math.round(layout.width),
    height: Math.round(layout.height),
  };
}

export const sameOverlay = (a: MapOverlay | undefined, b: MapOverlay) =>
  !!a && a.corner === b.corner && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/** Where each overlay sits on a `width` × `height` screen. Overlays on the right or bottom ride beside the panel. */
export function overlayBoxes(overlays: MapOverlay[], width: number, height: number, panel: PanelInsets): Box[] {
  return overlays.filter(visible).map(({ corner, x, y, width: w, height: h }) => ({
    left: hugsRight(corner) ? width - panel.right - x - w : x,
    top: hugsBottom(corner) ? height - panel.bottom - y - h : y,
    width: w,
    height: h,
  }));
}

/**
 * How far in from each edge the overlays reach. Each overlay claims the one side that costs the
 * graph the smaller share of the screen: a tall card on the left takes width, a wide bar at the
 * bottom takes height. Overlays on the right or bottom are counted past the panel.
 */
export function overlaySides(overlays: MapOverlay[], width: number, height: number, panel: PanelInsets): Sides {
  const sides = { ...NO_SIDES };
  if (width <= 0 || height <= 0) return sides;
  for (const { corner, x, y, width: w, height: h } of overlays.filter(visible)) {
    const right = hugsRight(corner);
    const bottom = hugsBottom(corner);
    const across = x + w + (right ? panel.right : 0);
    const down = y + h + (bottom ? panel.bottom : 0);
    if (across / width <= down / height) {
      const side = right ? "right" : "left";
      sides[side] = Math.max(sides[side], across);
    } else {
      const side = bottom ? "bottom" : "top";
      sides[side] = Math.max(sides[side], down);
    }
  }
  return sides;
}
