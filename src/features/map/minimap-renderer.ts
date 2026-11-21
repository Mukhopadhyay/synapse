import type { Point } from "./camera";
import type { MapController } from "./map-controller";
import { cssColor, scaleAlpha, type Palette } from "./palette";

/** Room around the visible notes, as a share of their extent. */
const PAD = { x: 0.07, y: 0.09 };
/** The viewport rectangle stays this far inside the minimap's edges (share of its size), so it never disappears. */
const VIEW_INSET = 0.015;
const VIEW_STROKE = 1.5;
const VIEW_RADIUS = 4;
const GRID_PITCH = 8;
const GRID_OPACITY = 0.7;
const GRID_DOT = 1;
/** Note dots are 3–6px across, by size on the map. */
const NODE_RADIUS = { min: 1.5, max: 3 };
const RING = 1.5;
/** While the live layout moves, the notes repaint at most this often. */
const MOVING_REPAINT_MS = 100;
/** While the main view turns (idle spin, or Fit easing it upright), the notes repaint at most this often. */
const TURNING_REPAINT_MS = 33;
const DRAG_TOLERANCE = 3;
const WHEEL_SENSITIVITY = 0.0015;
const TAU = Math.PI * 2;

/** The part of the graph the minimap shows: its centre in graph units, minimap px per graph unit, and the main view's turn it was drawn at. */
type Frame = { x: number; y: number; scale: number; angle: number };

export type MinimapCanvases = { base: HTMLCanvasElement; overlay: HTMLCanvasElement };

function context2d(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  return context;
}

/**
 * The minimap: every visible note and edge in a small canvas, with the main camera's viewport as a
 * signal rectangle and the rest dimmed. The notes are turned to match the main view, so the
 * viewport is always an upright rectangle. The notes (base canvas) repaint when the scene changes,
 * throttled while the layout moves or the view turns; the rectangle (overlay canvas) follows every
 * camera move and idle drift. Click centres the camera there, drag pans live, the wheel zooms. Returns a cleanup.
 */
export function createMinimap(canvases: MinimapCanvases, controller: MapController) {
  const { model } = controller;
  const { graph, layout } = model;
  const base = context2d(canvases.base);
  const overlay = context2d(canvases.overlay);
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame: Frame | null = null;
  let lastBase = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let press: { start: Point; dragging: boolean } | null = null;

  const toMini = (x: number, y: number): Point => {
    if (!frame) return { x: 0, y: 0 };
    const cos = Math.cos(frame.angle);
    const sin = Math.sin(frame.angle);
    const dx = x - frame.x;
    const dy = y - frame.y;
    return { x: width / 2 + (cos * dx - sin * dy) * frame.scale, y: height / 2 + (sin * dx + cos * dy) * frame.scale };
  };
  const toGraph = ({ x, y }: Point): Point => {
    if (!frame) return { x: 0, y: 0 };
    const cos = Math.cos(frame.angle);
    const sin = Math.sin(frame.angle);
    const dx = (x - width / 2) / frame.scale;
    const dy = (y - height / 2) / frame.scale;
    return { x: frame.x + cos * dx + sin * dy, y: frame.y - sin * dx + cos * dy };
  };

  /** How far the main view is turned on screen, in radians, read from its corners. */
  function viewAngle() {
    const corners = controller.viewport();
    if (!corners) return 0;
    const [topLeft, topRight] = corners;
    return Math.atan2(topLeft.y - topRight.y, topRight.x - topLeft.x);
  }

  /** Fits the visible notes, turned by `angle` and padded, into the minimap's shape. */
  function computeFrame(angle: number): Frame | null {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    graph.forEachNode((id) => {
      if (model.isHidden(id)) return;
      const position = layout.position(id);
      if (!position) return;
      const radius = layout.radius(id);
      const x = cos * (position.x ?? 0) - sin * (position.y ?? 0);
      const y = sin * (position.x ?? 0) + cos * (position.y ?? 0);
      left = Math.min(left, x - radius);
      right = Math.max(right, x + radius);
      top = Math.min(top, y - radius);
      bottom = Math.max(bottom, y + radius);
    });
    if (!Number.isFinite(left) || width === 0 || height === 0) return null;
    const spanX = Math.max(1, right - left) * (1 + PAD.x * 2);
    const spanY = Math.max(1, bottom - top) * (1 + PAD.y * 2);
    const centre = { x: (left + right) / 2, y: (top + bottom) / 2 };
    return {
      x: cos * centre.x + sin * centre.y,
      y: -sin * centre.x + cos * centre.y,
      scale: Math.min(width / spanX, height / spanY),
      angle,
    };
  }

  function drawGrid(palette: Palette) {
    base.beginPath();
    for (let x = GRID_PITCH / 2; x < width; x += GRID_PITCH) {
      for (let y = GRID_PITCH / 2; y < height; y += GRID_PITCH) {
        base.moveTo(x + GRID_DOT, y);
        base.arc(x, y, GRID_DOT, 0, TAU);
      }
    }
    base.fillStyle = cssColor(scaleAlpha(palette.grid, GRID_OPACITY));
    base.fill();
  }

  function drawBase() {
    clearTimeout(pending);
    pending = undefined;
    lastBase = performance.now();
    const palette = model.palette();
    base.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    base.fillStyle = cssColor(palette.background);
    base.fillRect(0, 0, width, height);
    drawGrid(palette);
    const angle = viewAngle();
    if (!frame || !layout.isMoving() || frame.angle !== angle) frame = computeFrame(angle);
    if (!frame) return;

    base.beginPath();
    graph.forEachEdge((edge, _attributes, source, target) => {
      if (model.edgeStyle(edge).hidden) return;
      const from = layout.position(source);
      const to = layout.position(target);
      if (!from || !to) return;
      const a = toMini(from.x ?? 0, from.y ?? 0);
      const b = toMini(to.x ?? 0, to.y ?? 0);
      base.moveTo(a.x, a.y);
      base.lineTo(b.x, b.y);
    });
    base.lineWidth = 1;
    base.strokeStyle = cssColor(palette.edgeRest);
    base.stroke();

    let smallest = Infinity;
    let largest = -Infinity;
    graph.forEachNode((id) => {
      const radius = layout.radius(id);
      smallest = Math.min(smallest, radius);
      largest = Math.max(largest, radius);
    });
    const dotRadius = (id: string) =>
      largest > smallest ? NODE_RADIUS.min + ((layout.radius(id) - smallest) / (largest - smallest)) * (NODE_RADIUS.max - NODE_RADIUS.min) : NODE_RADIUS.min;

    let selected: { point: Point; radius: number; color: string } | null = null;
    graph.forEachNode((id) => {
      if (model.isHidden(id)) return;
      const position = layout.position(id);
      if (!position) return;
      const style = model.nodeStyle(id);
      const point = toMini(position.x ?? 0, position.y ?? 0);
      const radius = dotRadius(id);
      if (style.selected) {
        selected = { point, radius, color: cssColor(style.ghost ? palette.background : style.color) };
        return;
      }
      base.beginPath();
      if (style.ghost) {
        base.arc(point.x, point.y, radius - 0.5, 0, TAU);
        base.lineWidth = 1;
        base.strokeStyle = cssColor(palette.borderStrong);
        base.stroke();
      } else {
        base.arc(point.x, point.y, radius, 0, TAU);
        base.fillStyle = cssColor(style.color);
        base.fill();
      }
    });
    if (selected) {
      const { point, radius, color } = selected as { point: Point; radius: number; color: string };
      for (const [extra, fill] of [
        [RING * 2, cssColor(palette.signal)],
        [RING, cssColor(palette.background)],
        [0, color],
      ] as const) {
        base.beginPath();
        base.arc(point.x, point.y, radius + extra, 0, TAU);
        base.fillStyle = fill;
        base.fill();
      }
    }
  }

  /** The main camera's viewport: an upright rounded signal rectangle, everything around it dimmed. */
  function drawOverlay() {
    overlay.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    overlay.clearRect(0, 0, width, height);
    const corners = controller.viewport();
    if (!frame || !corners) return;
    const points = corners.map((corner) => toMini(corner.x, corner.y));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const insetX = width * VIEW_INSET + VIEW_STROKE / 2;
    const insetY = height * VIEW_INSET + VIEW_STROKE / 2;
    const left = Math.min(width - insetX - 2, Math.max(insetX, Math.min(...xs)));
    const right = Math.max(left + 2, Math.min(width - insetX, Math.max(...xs)));
    const top = Math.min(height - insetY - 2, Math.max(insetY, Math.min(...ys)));
    const bottom = Math.max(top + 2, Math.min(height - insetY, Math.max(...ys)));

    const palette = model.palette();
    overlay.beginPath();
    overlay.rect(0, 0, width, height);
    overlay.roundRect(left, top, right - left, bottom - top, VIEW_RADIUS);
    overlay.fillStyle = cssColor(palette.minimapScrim);
    overlay.fill("evenodd");
    overlay.beginPath();
    overlay.roundRect(left, top, right - left, bottom - top, VIEW_RADIUS);
    overlay.lineWidth = VIEW_STROKE;
    overlay.strokeStyle = cssColor(palette.signal);
    overlay.stroke();
  }

  function repaint() {
    drawBase();
    drawOverlay();
  }

  /** Repaints the notes now, or once `throttle` ms have passed since the last time. */
  function requestBase(throttle: number) {
    const wait = throttle - (performance.now() - lastBase);
    if (wait > 0) {
      pending ??= setTimeout(repaint, wait);
      return;
    }
    repaint();
  }

  const onScene = () => requestBase(layout.isMoving() ? MOVING_REPAINT_MS : 0);

  /** The rectangle follows at once; a turned view also turns the notes, throttled. */
  function onView() {
    drawOverlay();
    if (frame && viewAngle() !== frame.angle) requestBase(TURNING_REPAINT_MS);
  }

  function resize() {
    const rect = canvases.base.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    pixelRatio = window.devicePixelRatio || 1;
    for (const canvas of [canvases.base, canvases.overlay]) {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    }
    frame = null;
    repaint();
  }

  const localPoint = (event: PointerEvent | WheelEvent): Point => {
    const rect = canvases.overlay.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    canvases.overlay.setPointerCapture(event.pointerId);
    press = { start: localPoint(event), dragging: false };
  }
  function onPointerMove(event: PointerEvent) {
    if (!press || !canvases.overlay.hasPointerCapture(event.pointerId)) return;
    const point = localPoint(event);
    if (!press.dragging && Math.hypot(point.x - press.start.x, point.y - press.start.y) < DRAG_TOLERANCE) return;
    press.dragging = true;
    controller.centreOn(toGraph(point), false);
  }
  function onPointerUp(event: PointerEvent) {
    if (press && !press.dragging) controller.centreOn(toGraph(localPoint(event)), true);
    press = null;
    if (canvases.overlay.hasPointerCapture(event.pointerId)) canvases.overlay.releasePointerCapture(event.pointerId);
  }
  function onPointerCancel(event: PointerEvent) {
    press = null;
    if (canvases.overlay.hasPointerCapture(event.pointerId)) canvases.overlay.releasePointerCapture(event.pointerId);
  }
  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    controller.zoomByNow(Math.exp(delta * WHEEL_SENSITIVITY));
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvases.base);
  resize();
  const stopScene = controller.onSceneChange(onScene);
  const stopView = controller.onViewChange(onView);
  const target = canvases.overlay;
  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("pointermove", onPointerMove);
  target.addEventListener("pointerup", onPointerUp);
  target.addEventListener("pointercancel", onPointerCancel);
  target.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    clearTimeout(pending);
    observer.disconnect();
    stopScene();
    stopView();
    target.removeEventListener("pointerdown", onPointerDown);
    target.removeEventListener("pointermove", onPointerMove);
    target.removeEventListener("pointerup", onPointerUp);
    target.removeEventListener("pointercancel", onPointerCancel);
    target.removeEventListener("wheel", onWheel);
  };
}
