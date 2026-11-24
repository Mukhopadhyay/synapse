/** Zoom rules measured against Fit: how far out the camera may go, the readout, and wheel steps. */

/** Zooming out stops at half of Fit (twice Fit's graph units per px). */
export const ZOOM_OUT_LIMIT = 2;
/** A wheel event never zooms by more than this factor, however big its delta. */
export const MAX_WHEEL_STEP = 1.15;
/** Per px of wheel delta: a 100px mouse notch zooms about 9%. */
const WHEEL_SENSITIVITY = 0.0009;
/** Trackpad pinch arrives as small ctrl+wheel deltas, so it gets a finer, faster scale. */
const PINCH_WHEEL_SENSITIVITY = 0.012;
/** Line-mode wheels (Firefox) report 3 lines per notch; 3 lines count as one 100px notch. */
const LINE_PX = 100 / 3;

export type WheelInput = { deltaY: number; deltaMode: number; ctrlKey: boolean };

/** The largest ratio (furthest out) the camera may reach after a fit at `fitRatio`. */
export function zoomOutLimit(fitRatio: number) {
  return fitRatio * ZOOM_OUT_LIMIT;
}

/** Zoom as a percentage of Fit (Fit = 100%). */
export function zoomPercent(fitRatio: number, ratio: number) {
  return Math.round((100 * fitRatio) / ratio);
}

/** The ratio multiplier for one wheel event: above 1 zooms out. `pageHeight` turns page-mode deltas into px. */
export function wheelZoomFactor({ deltaY, deltaMode, ctrlKey }: WheelInput, pageHeight: number) {
  const px = deltaMode === 1 ? deltaY * LINE_PX : deltaMode === 2 ? deltaY * pageHeight : deltaY;
  const factor = Math.exp(px * (ctrlKey ? PINCH_WHEEL_SENSITIVITY : WHEEL_SENSITIVITY));
  return Math.min(MAX_WHEEL_STEP, Math.max(1 / MAX_WHEEL_STEP, factor));
}
