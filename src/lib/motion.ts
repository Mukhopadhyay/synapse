/**
 * Motion tokens for JavaScript (Sigma camera, canvas fades). Mirrors the CSS variables in globals.css.
 * Under prefers-reduced-motion, movement is instant; opacity fades keep `instant` (120ms).
 */

export const DURATION = {
  instant: 120,
  quick: 200,
  base: 320,
  camera: 500,
  intro: 400,
} as const;

/** Solves a CSS cubic-bezier timing function for progress t in [0, 1]. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const slope = (a: number, b: number, t: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = curve(x1, x2, t) - x;
      const d = slope(x1, x2, t);
      if (Math.abs(error) < 1e-5 || d === 0) break;
      t -= error / d;
    }
    return curve(y1, y2, Math.min(1, Math.max(0, t)));
  };
}

export const easeStandard = cubicBezier(0.2, 0, 0, 1);
export const easeExit = cubicBezier(0.4, 0, 1, 1);

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Duration for a movement (camera, slide): zero under reduced motion. */
export function movementDuration(ms: number) {
  return prefersReducedMotion() ? 0 : ms;
}

/** Duration for an opacity fade: capped at `instant` under reduced motion. */
export function fadeDuration(ms: number) {
  return prefersReducedMotion() ? Math.min(ms, DURATION.instant) : ms;
}

/** Runs `onFrame` with eased progress 0→1 over `duration` ms. Returns a cancel function. */
export function tween(duration: number, onFrame: (progress: number) => void, easing = easeStandard) {
  if (duration <= 0) {
    onFrame(1);
    return () => {};
  }
  const start = performance.now();
  let frame = requestAnimationFrame(function step(now) {
    const linear = Math.min(1, (now - start) / duration);
    onFrame(easing(linear));
    if (linear < 1) frame = requestAnimationFrame(step);
  });
  return () => cancelAnimationFrame(frame);
}
