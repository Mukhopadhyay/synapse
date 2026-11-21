import type { GlowSprites } from "./glow-sprites";
import type { NodeStyle } from "./map-model";
import { cssColor, type Palette } from "./palette";

/** A node as placed on screen by the last main draw. */
export type ScreenNode = { id: string; x: number; y: number; radius: number; style: NodeStyle };

/** An edge of the focused note that carries moving dots. `both`: undirected, dots run each way. */
export type SignalEdge = { from: ScreenNode; to: ScreenNode; both: boolean; dashed: boolean; css: string };

const BREATH_MS = 3600;
const RIPPLE_MS = 2200;
const RIPPLE_SPREAD = 16;
const SIGNAL_MS = 1500;
const SIGNALS_PER_DIRECTION = 2;
const SIGNAL_DOT = 1.75;
const SIGNAL_DASH = 5;

const TAU = Math.PI * 2;
/** 0 → 1 → 0 over one period, starting from `phase`. */
const breath = (now: number, period: number, phase: number) => 0.5 - 0.5 * Math.cos(TAU * (now / period + phase));

/**
 * The animated layer between the backdrop and the graph: a slow, out-of-step breathing halo on
 * hubs, a stronger halo and an outgoing ripple on the selected note, and dots travelling along the
 * focused note's edges in their direction. With `still` (reduced motion) it draws one calm frame:
 * halos at rest, no ripple, no moving dots. Nothing here allocates per frame.
 */
export function createEffects(sprites: GlowSprites) {
  let signalStroke = "";
  let signalKey = "";

  function signalColor(palette: Palette) {
    const key = palette.signal.join(",");
    if (key !== signalKey) {
      signalKey = key;
      signalStroke = cssColor(palette.signal);
    }
    return signalStroke;
  }

  function drawHalo(context: CanvasRenderingContext2D, node: ScreenNode, palette: Palette, now: number, still: boolean) {
    const { style } = node;
    const b = still ? 0.5 : breath(now, BREATH_MS, style.phase);
    if (style.selected) {
      sprites.stamp(context, palette.signal, node.x, node.y, node.radius * (2.4 + 0.5 * b) + 6, palette.haloOpacity * (0.75 + 0.35 * b));
      if (still) return;
      const progress = (now % RIPPLE_MS) / RIPPLE_MS;
      context.beginPath();
      context.arc(node.x, node.y, node.radius + 2 + progress * RIPPLE_SPREAD, 0, TAU);
      context.globalAlpha = (1 - progress) ** 2 * 0.55;
      context.lineWidth = 1.25;
      context.strokeStyle = signalColor(palette);
      context.stroke();
      context.globalAlpha = 1;
      return;
    }
    sprites.stamp(context, style.color, node.x, node.y, node.radius * (2.1 + 0.45 * b) + 4, palette.haloOpacity * (0.5 + 0.5 * b) * style.visibility);
  }

  function drawSignals(context: CanvasRenderingContext2D, edge: SignalEdge, now: number) {
    const { from, to } = edge;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const span = length - from.radius - to.radius;
    if (span <= 4) return;
    const ux = dx / length;
    const uy = dy / length;
    context.fillStyle = edge.css;
    context.strokeStyle = edge.css;
    context.lineWidth = 1.5;
    context.lineCap = "round";
    const directions = edge.both ? 2 : 1;
    for (let direction = 0; direction < directions; direction++) {
      for (let k = 0; k < SIGNALS_PER_DIRECTION; k++) {
        const t = (now / SIGNAL_MS + k / SIGNALS_PER_DIRECTION + direction * 0.25) % 1;
        const along = from.radius + (direction === 0 ? t : 1 - t) * span;
        const x = from.x + ux * along;
        const y = from.y + uy * along;
        context.globalAlpha = Math.sin(Math.PI * t) * 0.9;
        context.beginPath();
        if (edge.dashed) {
          const half = SIGNAL_DASH / 2;
          context.moveTo(x - ux * half, y - uy * half);
          context.lineTo(x + ux * half, y + uy * half);
          context.stroke();
        } else {
          context.arc(x, y, SIGNAL_DOT, 0, TAU);
          context.fill();
        }
      }
    }
    context.globalAlpha = 1;
  }

  return {
    draw(
      context: CanvasRenderingContext2D,
      size: { width: number; height: number },
      ambient: ScreenNode[],
      signals: SignalEdge[],
      palette: Palette,
      now: number,
      still: boolean,
    ) {
      context.clearRect(0, 0, size.width, size.height);
      for (const node of ambient) {
        if (node.x < -60 || node.x > size.width + 60 || node.y < -60 || node.y > size.height + 60) continue;
        drawHalo(context, node, palette, now, still);
      }
      if (still) return;
      for (const edge of signals) drawSignals(context, edge, now);
    },
  };
}
