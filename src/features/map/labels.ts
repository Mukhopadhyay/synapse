import { cssColor, scaleAlpha, type Palette, type RGBA } from "./palette";

/** Map label drawing: plain labels right of their node, pills for hovered, focused or selected ones. */

/** Right of the node by default; left near the viewport's right edge; below or above when both sides are taken. */
export type LabelSide = "right" | "left" | "below" | "above";

export type LabelPlacement = {
  x: number;
  y: number;
  radius: number;
  label: string;
  size: number;
  width: number;
  fontFamily: string;
  weight: number;
  side: LabelSide;
  /** Sideways shift for labels below or above, keeping them on screen near the viewport's edges. */
  shift?: number;
};
export type LabelBox = { left: number; top: number; width: number; height: number };

export const LABEL_GAP = 6;
export const PILL_PADDING_X = 8;
const PILL_PADDING_Y = 4;
const GRID_CELL = 120;
const MEASURE_SIZE = 100;
/** The background-coloured outline behind label text, so edges never run through it. */
const HALO_WIDTH = 3;

export function labelFont(size: number, fontFamily: string, weight = 500) {
  return `${weight} ${size}px ${fontFamily}`;
}

/** Label widths measured once per font and scaled to any size, so a frame never re-measures text. */
export function createLabelMeasurer(context: CanvasRenderingContext2D) {
  const widths = new Map<string, number>();
  let font = "";
  return {
    width(label: string, size: number, fontFamily: string, weight = 500) {
      if (fontFamily !== font) {
        widths.clear();
        font = fontFamily;
      }
      const key = `${weight}|${label}`;
      let width = widths.get(key);
      if (width === undefined) {
        context.font = labelFont(MEASURE_SIZE, fontFamily, weight);
        width = context.measureText(label).width / MEASURE_SIZE;
        widths.set(key, width);
      }
      return width * size;
    },
    clear: () => widths.clear(),
  };
}

export function labelBox({ x, y, radius, size, width, side, shift = 0 }: LabelPlacement): LabelBox {
  if (side === "below" || side === "above") {
    const offset = radius + LABEL_GAP / 2 + size / 2;
    return { left: x - width / 2 + shift, top: y + (side === "below" ? offset : -offset) - size / 2, width, height: size };
  }
  const left = side === "right" ? x + radius + LABEL_GAP : x - radius - LABEL_GAP - width;
  return { left, top: y - size / 2, width, height: size };
}

/** Right of the node, or left when a right-hand label would cross `limit` (the viewport's right edge). */
export function labelSide(x: number, radius: number, width: number, limit: number, padding = 0): LabelSide {
  return x + radius + LABEL_GAP + width + padding > limit && x - radius - LABEL_GAP - width - padding > 0 ? "left" : "right";
}

/** How far a centred label below or above its node must slide to stay `margin` inside the viewport, never leaving the node behind. */
export function edgeShift(x: number, radius: number, width: number, limit: number, margin = 4) {
  const left = x - width / 2;
  const wanted = left < margin ? margin - left : left + width > limit - margin ? limit - margin - (left + width) : 0;
  const most = Math.max(0, width / 2 - radius);
  return Math.max(-most, Math.min(most, wanted));
}

/** Where to try a label when its preferred side is taken. */
export function fallbackSides(preferred: LabelSide): LabelSide[] {
  return preferred === "left" ? ["right", "below", "above"] : ["left", "below", "above"];
}

const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

/** Placed label boxes on a coarse grid, so labels never overlap. */
export function createLabelGrid() {
  const cells = new Map<string, LabelBox[]>();
  const keys = (box: LabelBox) => {
    const result: string[] = [];
    for (let column = Math.floor(box.left / GRID_CELL); column <= Math.floor((box.left + box.width) / GRID_CELL); column++) {
      for (let row = Math.floor(box.top / GRID_CELL); row <= Math.floor((box.top + box.height) / GRID_CELL); row++) {
        result.push(`${column}:${row}`);
      }
    }
    return result;
  };
  return {
    fits: (box: LabelBox) => keys(box).every((key) => !(cells.get(key) ?? []).some((other) => overlaps(box, other))),
    add: (box: LabelBox) => keys(box).forEach((key) => cells.set(key, [...(cells.get(key) ?? []), box])),
  };
}

export function drawNodeLabel(context: CanvasRenderingContext2D, placement: LabelPlacement, color: RGBA, halo: RGBA, opacity: number) {
  context.font = labelFont(placement.size, placement.fontFamily, placement.weight);
  context.textBaseline = "middle";
  const box = labelBox(placement);
  const y = box.top + box.height / 2;
  context.lineJoin = "round";
  context.lineWidth = HALO_WIDTH;
  context.strokeStyle = cssColor(scaleAlpha(halo, opacity * 0.85));
  context.strokeText(placement.label, box.left, y);
  context.fillStyle = cssColor(scaleAlpha(color, opacity));
  context.fillText(placement.label, box.left, y);
}

/** The box a hovered, focused or selected label's pill covers; pills only sit left or right. */
export function pillBox({ x, y, radius, size, width: textWidth, side }: LabelPlacement): LabelBox {
  const width = textWidth + PILL_PADDING_X * 2;
  const height = size + PILL_PADDING_Y * 2;
  const left = side === "left" ? x - radius - PILL_PADDING_Y - width : x + radius + PILL_PADDING_Y;
  return { left, top: y - height / 2, width, height };
}

/** Hovered, focused or selected label: `foreground` on a `surface` pill with a hairline. */
export function drawLabelPill(context: CanvasRenderingContext2D, placement: LabelPlacement, palette: Palette, opacity = 1) {
  const { y, label, size, fontFamily, weight } = placement;
  context.font = labelFont(size, fontFamily, weight);
  const { left, width, height } = pillBox(placement);

  context.beginPath();
  context.roundRect(left, y - height / 2, width, height, 6);
  context.fillStyle = cssColor(scaleAlpha(palette.surface, opacity));
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = cssColor(scaleAlpha(palette.border, opacity));
  context.stroke();

  context.textBaseline = "middle";
  context.fillStyle = cssColor(scaleAlpha(palette.foreground, opacity));
  context.fillText(label, left + PILL_PADDING_X, y);
}
