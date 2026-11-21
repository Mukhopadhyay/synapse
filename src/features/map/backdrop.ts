import type { CameraControl } from "./camera";
import type { GlowSprites } from "./glow-sprites";
import type { ClusterRegion } from "./map-model";
import { cssColor, scaleAlpha, type Palette } from "./palette";

/** Grid spacing in graph units at 100%; below GRID_MIN_PX on screen it doubles (48, 96, …). */
const GRID_UNIT = 24;
const GRID_MIN_PX = 12;
/** Screen px at any zoom. */
const DOT_RADIUS = 1;
/** The dots' screen-fixed mask: full strength inside 45% of an ellipse 75% of the screen wide and tall, 35% at its rim. */
const MASK = { radius: 0.75, inner: 0.45, edge: 0.35 };
const TAU = Math.PI * 2;

type Cached = { key: string; gradient: CanvasGradient };

/**
 * The canvas behind the graph: the background, a faint glow in each cluster's colour so clusters
 * read as regions, a world-space dot grid masked towards the edges, and a soft vignette. Redrawn
 * with the main layer (camera, drift, layout or style changes), never by the effects loop.
 */
export function createBackdrop(sprites: GlowSprites) {
  let vignette: Cached | null = null;
  let mask: Cached | null = null;

  function vignetteGradient(context: CanvasRenderingContext2D, width: number, height: number, palette: Palette) {
    const key = `${width}x${height}|${palette.vignette.join(",")}`;
    if (vignette?.key === key) return vignette.gradient;
    const radius = Math.hypot(width, height) / 2;
    const gradient = context.createRadialGradient(width / 2, height / 2, radius * 0.45, width / 2, height / 2, radius);
    gradient.addColorStop(0, cssColor(scaleAlpha(palette.vignette, 0)));
    gradient.addColorStop(1, cssColor(palette.vignette));
    vignette = { key, gradient };
    return gradient;
  }

  /** Keeps the dots drawn so far at the mask's strength. Canvas gradients are circles, so it's drawn squashed into the ellipse. */
  function applyMask(context: CanvasRenderingContext2D, width: number, height: number) {
    const key = `${width}x${height}`;
    if (mask?.key !== key) {
      const radius = width * MASK.radius;
      const gradient = context.createRadialGradient(width / 2, width / 2, 0, width / 2, width / 2, radius);
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(MASK.inner, "rgba(0,0,0,1)");
      gradient.addColorStop(1, `rgba(0,0,0,${MASK.edge})`);
      mask = { key, gradient };
    }
    context.save();
    context.globalCompositeOperation = "destination-in";
    context.scale(1, height / width);
    context.fillStyle = mask.gradient;
    context.fillRect(0, 0, width, width);
    context.restore();
  }

  function drawGrid(context: CanvasRenderingContext2D, camera: CameraControl, palette: Palette, width: number, height: number) {
    const ratio = camera.ratio();
    let unit = GRID_UNIT;
    while (unit / ratio < GRID_MIN_PX) unit *= 2;
    /** Dots off the next level's grid fade out as the spacing shrinks towards the point where it doubles. */
    const fineAlpha = Math.min(1, (unit / ratio - GRID_MIN_PX) / GRID_MIN_PX);

    const corners = [camera.toGraph({ x: 0, y: 0 }), camera.toGraph({ x: width, y: 0 }), camera.toGraph({ x: 0, y: height }), camera.toGraph({ x: width, y: height })];
    const firstColumn = Math.floor(Math.min(...corners.map((point) => point.x)) / unit);
    const lastColumn = Math.ceil(Math.max(...corners.map((point) => point.x)) / unit);
    const firstRow = Math.floor(Math.min(...corners.map((point) => point.y)) / unit);
    const lastRow = Math.ceil(Math.max(...corners.map((point) => point.y)) / unit);
    const { originX, originY, ux, uy, vx, vy } = camera.basis();

    for (const coarsePass of [true, false]) {
      if (!coarsePass && fineAlpha <= 0) break;
      context.beginPath();
      for (let column = firstColumn; column <= lastColumn; column++) {
        const columnX = originX + column * unit * ux;
        const columnY = originY + column * unit * uy;
        for (let row = firstRow; row <= lastRow; row++) {
          if ((column % 2 === 0 && row % 2 === 0) !== coarsePass) continue;
          const x = columnX + row * unit * vx;
          const y = columnY + row * unit * vy;
          if (x < -DOT_RADIUS || x > width + DOT_RADIUS || y < -DOT_RADIUS || y > height + DOT_RADIUS) continue;
          context.moveTo(x + DOT_RADIUS, y);
          context.arc(x, y, DOT_RADIUS, 0, TAU);
        }
      }
      context.fillStyle = cssColor(coarsePass ? palette.grid : scaleAlpha(palette.grid, fineAlpha));
      context.fill();
    }
  }

  return {
    draw(context: CanvasRenderingContext2D, camera: CameraControl, palette: Palette, regions: ClusterRegion[]) {
      const { width, height } = camera.size();
      context.clearRect(0, 0, width, height);
      drawGrid(context, camera, palette, width, height);
      applyMask(context, width, height);

      /** Glows, then the background, go underneath the masked dots. */
      context.globalCompositeOperation = "destination-over";
      const ratio = camera.ratio();
      for (const region of regions) {
        const point = camera.toScreen(region.x, region.y);
        sprites.stamp(context, region.color, point.x, point.y, region.radius / ratio, palette.glowOpacity * region.opacity);
      }
      context.fillStyle = cssColor(palette.background);
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      context.fillStyle = vignetteGradient(context, width, height, palette);
      context.fillRect(0, 0, width, height);
    },
  };
}
