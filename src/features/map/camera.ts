import { DURATION, movementDuration, tween } from "@/lib/motion";

/** The point of the graph at the centre of the screen, and graph units per screen px (1 = 100%). */
export type Camera = { x: number; y: number; ratio: number };
export type Point = { x: number; y: number };
/** The part of the screen the graph should use, in px from each edge. */
export type Frame = { top: number; right: number; bottom: number; left: number };
/** A temporary offset layered on the camera (idle drift): graph units, a zoom factor and radians. */
export type ViewOffset = { dx: number; dy: number; zoom: number; angle: number };
/** Where graph (0, 0) lands on screen and the screen step per graph unit along x and y. */
export type ScreenBasis = { originX: number; originY: number; ux: number; uy: number; vx: number; vy: number };

export const MIN_RATIO = 0.2;
export const MAX_RATIO = 24;
export const ZOOM_STEP = 1.5;

const NO_OFFSET: ViewOffset = { dx: 0, dy: 0, zoom: 1, angle: 0 };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
export const clampRatio = (ratio: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));

/** A box a node and its label take up, in graph units and screen px. */
export type FitItem = { x: number; y: number; radius: number; label: { width: number; height: number; gap: number } | null };

/**
 * The 2D camera: graph ↔ screen transforms, pans, zooms towards a point, and animated moves.
 * Besides position and zoom it keeps a rotation, left behind when the idle spin is baked in;
 * Fit and restored cameras ease it back to zero. `onChange(base)` runs after every change: `base`
 * is false when only the drift offset moved, so history saves can ignore it.
 */
export function createCamera(onChange: (base: boolean) => void) {
  let state: Camera = { x: 0, y: 0, ratio: 1 };
  let angle = 0;
  let offset: ViewOffset = NO_OFFSET;
  let width = 0;
  let height = 0;
  let cancelAnimation = () => {};

  /** The view actually drawn: the camera with the drift offset applied. */
  const view = () => ({
    x: state.x + offset.dx,
    y: state.y + offset.dy,
    ratio: state.ratio / offset.zoom,
    cos: Math.cos(angle + offset.angle),
    sin: Math.sin(angle + offset.angle),
  });

  const toScreen = (x: number, y: number): Point => {
    const v = view();
    const dx = (x - v.x) / v.ratio;
    const dy = (y - v.y) / v.ratio;
    return { x: width / 2 + v.cos * dx - v.sin * dy, y: height / 2 + v.sin * dx + v.cos * dy };
  };
  const toGraph = ({ x, y }: Point): Point => {
    const v = view();
    const dx = x - width / 2;
    const dy = y - height / 2;
    return { x: v.x + (v.cos * dx + v.sin * dy) * v.ratio, y: v.y + (-v.sin * dx + v.cos * dy) * v.ratio };
  };
  /** A screen-px vector turned into graph axes (undoing the rotation), unscaled. */
  const unrotate = (dx: number, dy: number): Point => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: cos * dx + sin * dy, y: -sin * dx + cos * dy };
  };

  function set(next: Camera, nextAngle = angle) {
    state = { x: next.x, y: next.y, ratio: clampRatio(next.ratio) };
    angle = nextAngle;
    onChange(true);
  }

  /** Eases to `target`; the rotation eases to `targetAngle` (zero unless given). */
  function animate(target: Partial<Camera>, duration = movementDuration(DURATION.camera), targetAngle = 0) {
    cancelAnimation();
    const from = { ...state };
    const fromAngle = angle;
    const to = { ...state, ...target, ratio: clampRatio(target.ratio ?? state.ratio) };
    if (duration <= 0) return set(to, targetAngle);
    cancelAnimation = tween(duration, (t) =>
      set({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), ratio: from.ratio * (to.ratio / from.ratio) ** t }, lerp(fromAngle, targetAngle, t)),
    );
  }

  /** Zooms keeping the graph point under `point` fixed on screen. */
  function zoomAround(point: Point, ratio: number, anchor = toGraph(point)) {
    const next = clampRatio(ratio);
    const along = unrotate(point.x - width / 2, point.y - height / 2);
    set({ ratio: next, x: anchor.x - along.x * next, y: anchor.y - along.y * next });
  }

  /** `from` moved by a screen-px drag of (dx, dy): the graph follows the pointer. */
  function panFrom(from: Camera, dx: number, dy: number) {
    const along = unrotate(dx, dy);
    set({ ratio: from.ratio, x: from.x - along.x * from.ratio, y: from.y - along.y * from.ratio });
  }

  /**
   * The camera that shows every item, labels included, inside `frame`. Labels keep their screen
   * size while nodes scale, so the ratio is found by bisection; `items(ratio)` lists every node with
   * the label it would show at that zoom. Assumes no rotation (fitting eases it to zero).
   */
  function fitting(items: (ratio: number) => FitItem[], frame: Frame): Camera {
    const available = { width: width - frame.left - frame.right, height: height - frame.top - frame.bottom };
    if (items(1).length === 0 || available.width <= 0 || available.height <= 0) return { x: 0, y: 0, ratio: 1 };

    const extent = (ratio: number) => {
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      for (const { x, y, radius, label } of items(ratio)) {
        const sx = x / ratio;
        const sy = y / ratio;
        const r = radius / ratio;
        left = Math.min(left, sx - r);
        right = Math.max(right, sx + r + (label ? label.gap + label.width : 0));
        top = Math.min(top, sy - Math.max(r, label ? label.height / 2 : 0));
        bottom = Math.max(bottom, sy + Math.max(r, label ? label.height / 2 : 0));
      }
      return { left, right, top, bottom };
    };
    const fits = (ratio: number) => {
      const box = extent(ratio);
      return box.right - box.left <= available.width && box.bottom - box.top <= available.height;
    };

    let low = MIN_RATIO;
    let high = MAX_RATIO;
    if (fits(low)) high = low;
    for (let i = 0; i < 30 && high - low > 1e-3; i++) {
      const middle = Math.sqrt(low * high);
      if (fits(middle)) high = middle;
      else low = middle;
    }
    const ratio = high;
    const box = extent(ratio);
    const centre = { x: frame.left + available.width / 2, y: frame.top + available.height / 2 };
    return {
      ratio,
      x: ((box.left + box.right) / 2) * ratio - (centre.x - width / 2) * ratio,
      y: ((box.top + box.bottom) / 2) * ratio - (centre.y - height / 2) * ratio,
    };
  }

  return {
    get: () => ({ ...state }),
    set,
    animate,
    /** Eases the camera keeping its current rotation (fly-to, reveal). */
    glide: (target: Partial<Camera>, duration?: number) => animate(target, duration, angle),
    cancel: () => cancelAnimation(),
    zoomAround,
    panFrom,
    /** Moves the camera by a screen-px vector. */
    panBy: (dx: number, dy: number) => panFrom(state, -dx, -dy),
    /** A screen-px offset from the centre, as a graph-unit offset at the current zoom. */
    screenOffset: (dx: number, dy: number): Point => {
      const along = unrotate(dx, dy);
      return { x: along.x * state.ratio, y: along.y * state.ratio };
    },
    fitting,
    toScreen,
    toGraph,
    /** For drawing many points without allocating: screen = origin + x·u + y·v. */
    basis(): ScreenBasis {
      const v = view();
      const origin = toScreen(0, 0);
      return { originX: origin.x, originY: origin.y, ux: v.cos / v.ratio, uy: v.sin / v.ratio, vx: -v.sin / v.ratio, vy: v.cos / v.ratio };
    },
    /** Graph units per screen px as drawn, drift included. */
    ratio: () => state.ratio / offset.zoom,
    /**
     * The graph-unit shift that keeps whatever sits under screen point `pivot` in place when the
     * view turns by an extra `extraAngle` and zooms by `zoom`, so drift spins around that point.
     */
    pivotOffset(pivot: Point, extraAngle: number, zoom: number): Point {
      const sx = pivot.x - width / 2;
      const sy = pivot.y - height / 2;
      const turn = (a: number, scale: number): Point => ({
        x: (Math.cos(a) * sx + Math.sin(a) * sy) * scale,
        y: (-Math.sin(a) * sx + Math.cos(a) * sy) * scale,
      });
      const before = turn(angle, state.ratio);
      const after = turn(angle + extraAngle, state.ratio / zoom);
      return { x: before.x - after.x, y: before.y - after.y };
    },
    /** The drift offset, redrawn but never saved. */
    setOffset(next: ViewOffset) {
      offset = next;
      onChange(false);
    },
    /** Folds the drift offset into the camera, so stopping it moves nothing on screen. */
    bake() {
      if (offset === NO_OFFSET) return;
      const v = view();
      const next = { x: v.x, y: v.y, ratio: v.ratio };
      angle += offset.angle;
      offset = NO_OFFSET;
      set(next);
    },
    resize(nextWidth: number, nextHeight: number) {
      width = nextWidth;
      height = nextHeight;
    },
    size: () => ({ width, height }),
  };
}

export type CameraControl = ReturnType<typeof createCamera>;
