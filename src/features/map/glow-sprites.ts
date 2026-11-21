import type { RGBA } from "./palette";

const SPRITE_SIZE = 128;
/** A soft falloff, close to a Gaussian, so a stamped glow has no visible edge. */
const STOPS: [number, number][] = [
  [0, 1],
  [0.2, 0.7],
  [0.45, 0.28],
  [0.7, 0.08],
  [1, 0],
];

type Sprite = OffscreenCanvas | HTMLCanvasElement;

/**
 * Soft radial glows, rendered once per colour and stamped with drawImage. Halos and cluster glows
 * reuse them every frame, so nothing allocates a gradient while animating. Cleared on theme change.
 */
export function createGlowSprites() {
  const cache = new Map<string, Sprite>();

  function render([r, g, b]: RGBA): Sprite {
    const sprite = new OffscreenCanvas(SPRITE_SIZE, SPRITE_SIZE);
    const context = sprite.getContext("2d");
    if (!context) return sprite;
    const middle = SPRITE_SIZE / 2;
    const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
    for (const [offset, alpha] of STOPS) gradient.addColorStop(offset, `rgba(${r},${g},${b},${alpha})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return sprite;
  }

  return {
    /** Stamps a glow of `color` centred on (x, y) with the given screen radius and opacity. */
    stamp(context: CanvasRenderingContext2D, color: RGBA, x: number, y: number, radius: number, opacity: number) {
      if (opacity <= 0.002 || radius <= 0) return;
      const key = `${color[0]},${color[1]},${color[2]}`;
      let sprite = cache.get(key);
      if (!sprite) {
        sprite = render(color);
        cache.set(key, sprite);
      }
      context.globalAlpha = Math.min(1, opacity);
      context.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
      context.globalAlpha = 1;
    },
    clear: () => cache.clear(),
  };
}

export type GlowSprites = ReturnType<typeof createGlowSprites>;
