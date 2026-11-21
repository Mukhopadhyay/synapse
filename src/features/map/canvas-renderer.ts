import { LINE_DASHES } from "@/lib/content/relations";
import { useSearchStore } from "@/features/search/search-store";
import { useMapStore, type Insets } from "@/lib/store/map-store";

import { prefersReducedMotion } from "@/lib/motion";

import { createBackdrop } from "./backdrop";
import { createCamera, type FitItem, type Frame, type Point } from "./camera";
import { createDrift } from "./drift";
import { createEffects, type ScreenNode, type SignalEdge } from "./effects";
import { attachGestures } from "./gestures";
import { createGlowSprites } from "./glow-sprites";
import {
  createLabelGrid,
  createLabelMeasurer,
  drawLabelPill,
  drawNodeLabel,
  edgeShift,
  fallbackSides,
  labelBox,
  labelSide,
  LABEL_GAP,
  PILL_PADDING_X,
  pillBox,
  type LabelPlacement,
  type LabelSide,
} from "./labels";
import { isTagNode, TAG_PREFIX, type EdgeStyle, type MapModel } from "./map-model";
import { cssColor, mixColor, scaleAlpha, type Palette } from "./palette";
import type { MapRenderer } from "./renderer";

/** Minimum hit radius in px, whatever the drawn size. */
const HIT_RADIUS = { mouse: 12, touch: 24 };
const ARROW_LENGTH = 6;
const ARROW_WIDTH = 4.5;
const FOCUS_RING_GAP = 3;
/** Space kept clear around the graph when fitting: below the top bar, above the legend and hint, and at the sides. */
const FIT_MARGIN = { top: 72, bottom: 60, side: 24 };
/** A node closer than this to the edge is brought into view when it gets keyboard focus. */
const REVEAL_MARGIN = 48;
const LABEL_CULL_MARGIN = 200;
/** Fit makes room for labels at least this visible; fainter ones may run past the edge. */
const FIT_LABEL_OPACITY = 0.5;
/** `cluster-label` size and its gap above a field's topmost node. */
const FIELD_LABEL_SIZE = 20;
const FIELD_LABEL_GAP = 16;
/** With fewer nodes than this on screen, a crowded label tries the other sides of its node before hiding. */
const LABEL_FALLBACK_LIMIT = 40;
/** Hub halos alone breathe at ~30fps; moving dots and camera moves get every frame. */
const AMBIENT_FRAME_MS = 32;
const GHOST_DASH = [2.5, 2.5];

type PlacedNode = ScreenNode;

/** The map's three stacked canvases: backdrop at the bottom, animated effects, then the graph (which takes input). */
export type MapCanvases = { backdrop: HTMLCanvasElement; effects: HTMLCanvasElement; main: HTMLCanvasElement };

const onScreenBox = (box: { left: number; width: number }, width: number) => box.left >= 0 && box.left + box.width <= width;

function context2d(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  return context;
}

/** Input on the map that stops idle drift. */
const DRIFT_INPUTS = ["pointerdown", "pointermove", "wheel", "touchstart"] as const;

/**
 * The map's renderer: draws the model on Canvas 2D and turns pointer input into hover, open, drag
 * and camera moves. One frame loop drives three layers: the graph and its backdrop redraw only when
 * something changed (the live layout ticks once per frame while it moves, idle drift moves the
 * camera), and the effects layer animates hub halos and edge signals. The loop stops when the graph
 * rests and nothing animates, when the tab is hidden, or while the map is under another view.
 */
export function createCanvasRenderer(canvases: MapCanvases, model: MapModel): MapRenderer {
  const canvas = canvases.main;
  const context = context2d(canvas);
  const backdropContext = context2d(canvases.backdrop);
  const effectsContext = context2d(canvases.effects);
  const { graph, layout } = model;
  const reduced = prefersReducedMotion();
  const sprites = createGlowSprites();
  const backdrop = createBackdrop(sprites);
  const effects = createEffects(sprites);
  const store = useMapStore.getState;
  const cameraListeners = new Set<() => void>();
  const viewListeners = new Set<() => void>();
  const sceneListeners = new Set<() => void>();
  const gestureListeners = new Set<() => void>();
  const settleListeners = new Set<() => void>();
  const measurer = createLabelMeasurer(context);

  let pixelRatio = 1;
  let frame = 0;
  let dirty = true;
  let sceneChanged = true;
  let detached = false;
  let layoutMoving = false;
  let lastEffects = 0;
  let ambient: PlacedNode[] = [];
  let signals: SignalEdge[] = [];
  let paletteSeen: Palette | null = null;
  let dragOffset: Point = { x: 0, y: 0 };

  const camera = createCamera((base) => {
    requestDraw();
    viewListeners.forEach((listener) => listener());
    if (base) cameraListeners.forEach((listener) => listener());
  });

  /** Nodes scale with zoom; labels keep their screen size. */
  const screenRadius = (size: number) => size / camera.ratio();

  function schedule() {
    if (!frame && !detached) frame = requestAnimationFrame(tick);
  }

  function requestDraw() {
    dirty = true;
    schedule();
  }

  function restyle() {
    sceneChanged = true;
    requestDraw();
  }

  /** Something on the effects layer moves: hub halos or a selection on screen, or signals along edges. */
  const animating = () => !reduced && !document.hidden && !store().mapHidden && (ambient.length > 0 || signals.length > 0);

  function placeNodes(): PlacedNode[] {
    return graph
      .mapNodes((id) => {
        const style = model.nodeStyle(id);
        const { x, y } = camera.toScreen(style.x, style.y);
        return { id, x, y, radius: screenRadius(style.size), style };
      })
      .filter((node) => !node.style.hidden)
      .sort((a, b) => a.style.zIndex - b.style.zIndex);
  }

  function drawEdges(ctx: CanvasRenderingContext2D, placed: Map<string, PlacedNode>, palette: Palette) {
    const { width, height } = camera.size();
    const styles = graph
      .mapEdges((id) => model.edgeStyle(id))
      .filter((style) => !style.hidden)
      .sort((a, b) => a.zIndex - b.zIndex);

    type Batch = { style: EdgeStyle; segments: number[] };
    const batches = new Map<string, Batch>();
    const heads: { style: EdgeStyle; tip: Point; ux: number; uy: number }[] = [];

    for (const style of styles) {
      const from = placed.get(style.source);
      const to = placed.get(style.target);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy);
      if (length <= from.radius + to.radius) continue;
      if (Math.max(from.x, to.x) < 0 || Math.min(from.x, to.x) > width || Math.max(from.y, to.y) < 0 || Math.min(from.y, to.y) > height) continue;

      const ux = dx / length;
      const uy = dy / length;
      const tip = { x: to.x - ux * to.radius, y: to.y - uy * to.radius };
      const arrowLength = style.head === "none" ? 0 : Math.max(1, style.width) * ARROW_LENGTH;
      const key = `${style.zIndex}|${style.color.join(",")}|${style.width}|${style.line}`;
      const batch = batches.get(key) ?? { style, segments: [] };
      batch.segments.push(from.x + ux * from.radius, from.y + uy * from.radius, tip.x - ux * arrowLength, tip.y - uy * arrowLength);
      batches.set(key, batch);
      if (style.head !== "none") heads.push({ style, tip, ux, uy });
    }

    for (const { style, segments } of batches.values()) {
      ctx.beginPath();
      for (let i = 0; i < segments.length; i += 4) {
        ctx.moveTo(segments[i], segments[i + 1]);
        ctx.lineTo(segments[i + 2], segments[i + 3]);
      }
      ctx.setLineDash(LINE_DASHES[style.line]);
      ctx.lineWidth = style.width;
      ctx.strokeStyle = cssColor(style.color);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    for (const { style, tip, ux, uy } of heads) {
      const scale = Math.max(1, style.width);
      const arrowLength = scale * ARROW_LENGTH;
      const halfWidth = (scale * ARROW_WIDTH) / 2;
      const base = { x: tip.x - ux * arrowLength, y: tip.y - uy * arrowLength };
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(base.x - uy * halfWidth, base.y + ux * halfWidth);
      ctx.lineTo(base.x + uy * halfWidth, base.y - ux * halfWidth);
      ctx.closePath();
      const color = cssColor(style.color);
      if (style.head === "filled") {
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.fillStyle = cssColor(palette.background);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    }
  }

  function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
  }

  function drawNode(ctx: CanvasRenderingContext2D, { x, y, radius, style }: PlacedNode) {
    const { width, height } = camera.size();
    if (x < -radius || x > width + radius || y < -radius || y > height + radius) return;
    let inner = radius;
    if (style.selected) {
      circle(ctx, x, y, radius);
      ctx.fillStyle = cssColor(style.ring);
      ctx.fill();
      circle(ctx, x, y, radius - 2);
      ctx.fillStyle = cssColor(style.gap);
      ctx.fill();
      inner = radius - 5;
    }
    circle(ctx, x, y, inner);
    ctx.fillStyle = cssColor(style.fill);
    ctx.fill();
    if (style.ghost) {
      circle(ctx, x, y, inner - 0.75);
      ctx.setLineDash(GHOST_DASH);
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = cssColor(style.stroke);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (style.focused) {
      circle(ctx, x, y, radius + FOCUS_RING_GAP + 1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = cssColor(style.ring);
      ctx.stroke();
    }
  }

  function placement(node: PlacedNode, size: number, fontFamily: string, side?: LabelSide): LabelPlacement {
    const label = node.style.label ?? "";
    const radius = node.style.focused ? node.radius + FOCUS_RING_GAP + 2 : node.radius;
    const weight = node.style.labelWeight;
    const width = measurer.width(label, size, fontFamily, weight);
    const padding = node.style.pinned ? PILL_PADDING_X * 2 : 0;
    const limit = camera.size().width;
    const chosen = side ?? labelSide(node.x, radius, width, limit, padding);
    const shift = chosen === "below" || chosen === "above" ? edgeShift(node.x, radius, width, limit) : 0;
    return { x: node.x, y: node.y, radius, label, size, width, fontFamily, weight, side: chosen, shift };
  }

  /** Tells the live layout where pills sit, so settling nodes keep off them. */
  function guardPills(pills: { id: string; box: { left: number; top: number; width: number; height: number }; x: number; y: number }[]) {
    const ratio = camera.ratio();
    layout.guardLabels(
      pills.map(({ id, box, x, y }) => ({
        id,
        left: (box.left - x) * ratio,
        top: (box.top - y) * ratio,
        width: box.width * ratio,
        height: box.height * ratio,
      })),
    );
  }

  function drawLabels(ctx: CanvasRenderingContext2D, placed: PlacedNode[], palette: Palette) {
    const { width, height } = camera.size();
    const ratio = camera.ratio();
    const size = model.labelSize(ratio);
    const { fontFamily } = palette;
    const grid = createLabelGrid();
    const visible = (node: PlacedNode) =>
      node.x > -LABEL_CULL_MARGIN && node.x < width + LABEL_CULL_MARGIN && node.y > -size && node.y < height + size;

    const onScreen = placed.filter(visible);
    const pinned = onScreen.filter((node) => node.style.pinned && node.style.label);
    const pills = pinned.map((node) => ({ node, place: placement(node, size, fontFamily) }));
    for (const node of onScreen) grid.add({ left: node.x - node.radius, top: node.y - node.radius, width: node.radius * 2, height: node.radius * 2 });
    for (const { place } of pills) grid.add(pillBox(place));
    const covered = store().leftInset;
    if (covered) grid.add({ left: -LABEL_CULL_MARGIN, top: -size, width: covered + LABEL_CULL_MARGIN, height: height + size * 2 });
    guardPills(pills.map(({ node, place }) => ({ id: node.id, box: pillBox(place), x: node.x, y: node.y })));

    const fallback = onScreen.length < LABEL_FALLBACK_LIMIT;
    const candidates = onScreen
      .filter((node) => node.style.label && !node.style.pinned)
      .map((node) => ({ node, opacity: node.style.forceLabel ? 1 : model.labelOpacity(ratio, node.style.size) }))
      .filter(({ opacity }) => opacity > 0.02)
      .sort(
        (a, b) =>
          Number(b.node.style.forceLabel) - Number(a.node.style.forceLabel) ||
          b.node.style.links - a.node.style.links ||
          b.node.radius - a.node.radius,
      );

    for (const { node, opacity } of candidates) {
      const preferred = placement(node, size, fontFamily);
      const options = fallback ? [preferred, ...fallbackSides(preferred.side).map((side) => placement(node, size, fontFamily, side))] : [preferred];
      const fitting = options.filter((option) => grid.fits(labelBox(option)));
      const atEdge = node.x - node.radius < 0 || node.x + node.radius > width;
      const place = fitting.find((option) => onScreenBox(labelBox(option), width)) ?? (atEdge ? fitting[0] : undefined);
      if (!place) continue;
      grid.add(labelBox(place));
      drawNodeLabel(ctx, place, node.style.labelColor, palette.background, opacity);
    }

    for (const { place } of pills) drawLabelPill(ctx, place, palette);
  }

  /** Field names above each field on the all-fields map, in the `cluster-label` style. */
  function drawFieldLabels(ctx: CanvasRenderingContext2D, palette: Palette) {
    const labels = model.fieldLabels();
    if (labels.length === 0) return;
    ctx.font = `600 ${FIELD_LABEL_SIZE}px ${palette.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const { name, x, top, opacity } of labels) {
      const point = camera.toScreen(x, top);
      ctx.fillStyle = cssColor(scaleAlpha(palette.foreground, palette.clusterLabelOpacity * opacity));
      ctx.fillText(name, point.x, point.y - FIELD_LABEL_GAP);
    }
    ctx.textAlign = "start";
  }

  /** The focused note's visible typed edges, with their direction and line style, for the effects layer. */
  function signalEdges(byId: Map<string, PlacedNode>, palette: Palette): SignalEdge[] {
    const center = model.focusCenter();
    if (!center) return [];
    const centerNode = byId.get(center);
    if (!centerNode) return [];
    const css = cssColor(mixColor(centerNode.style.color, palette.foreground, 0.25));
    const result: SignalEdge[] = [];
    graph.forEachEdge(center, (edge) => {
      const style = model.edgeStyle(edge);
      if (style.hidden || style.kind === "tag") return;
      const from = byId.get(style.source);
      const to = byId.get(style.target);
      if (from && to) result.push({ from, to, both: !style.directed, dashed: style.line !== "solid", css });
    });
    return result;
  }

  /** The graph and its backdrop. Returns whether the layout is still moving. */
  function drawMain() {
    const moved = layout.step();
    if (moved) sceneChanged = true;
    const { width, height } = camera.size();
    if (width === 0 || height === 0) return false;
    const palette = model.palette();
    if (palette !== paletteSeen) {
      if (paletteSeen) sprites.clear();
      paletteSeen = palette;
    }
    for (const ctx of [context, backdropContext, effectsContext]) ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    backdrop.draw(backdropContext, camera, palette, model.clusterRegions());
    context.clearRect(0, 0, width, height);

    const placed = placeNodes();
    const byId = new Map(placed.map((node) => [node.id, node]));
    drawEdges(context, byId, palette);
    for (const node of placed) drawNode(context, node);
    drawLabels(context, placed, palette);
    drawFieldLabels(context, palette);

    ambient = placed.filter((node) => (node.style.hub || node.style.selected) && node.style.visibility > 0.05);
    signals = signalEdges(byId, palette);
    return moved || layout.isMoving();
  }

  function tick(now: number) {
    frame = 0;
    const { width, height } = camera.size();
    const offset = drift.frame(now, width, height, camera.get().ratio);
    if (offset) {
      const { leftInset, bottomInset } = store();
      const pivot = { x: leftInset + (width - leftInset) / 2, y: (height - bottomInset) / 2 };
      const centred = camera.pivotOffset(pivot, offset.angle, offset.zoom);
      camera.setOffset({ ...offset, dx: offset.dx + centred.x, dy: offset.dy + centred.y });
    }
    const drewMain = dirty;
    if (dirty) {
      dirty = drawMain();
      const settled = layoutMoving && !dirty;
      layoutMoving = dirty;
      if (sceneChanged) {
        sceneChanged = false;
        sceneListeners.forEach((listener) => listener());
      }
      if (settled) settleListeners.forEach((listener) => listener());
    }
    const animate = animating();
    const due = now - lastEffects >= (signals.length > 0 ? 0 : AMBIENT_FRAME_MS);
    if (drewMain || (animate && due)) {
      effects.draw(effectsContext, camera.size(), ambient, signals, model.palette(), now, reduced);
      lastEffects = now;
    }
    if (dirty || animate) schedule();
  }

  function pick(point: Point, pointerType: string): string | null {
    const minimum = pointerType === "touch" ? HIT_RADIUS.touch : HIT_RADIUS.mouse;
    let best: string | null = null;
    let bestDistance = Infinity;
    graph.forEachNode((id) => {
      const node = layout.position(id);
      if (!node || model.isHidden(id)) return;
      const position = camera.toScreen(node.x ?? 0, node.y ?? 0);
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      if (distance <= Math.max(screenRadius(layout.radius(id)), minimum) && distance < bestDistance) {
        best = id;
        bestDistance = distance;
      }
    });
    return best;
  }

  function fitFrame(insets: Insets): Frame {
    return {
      top: FIT_MARGIN.top + (model.fieldLabels().length ? FIELD_LABEL_SIZE + FIELD_LABEL_GAP : 0),
      left: FIT_MARGIN.side + store().leftInset,
      right: FIT_MARGIN.side + insets.right,
      bottom: (insets.bottom || store().bottomInset ? FIT_MARGIN.side : FIT_MARGIN.bottom) + insets.bottom + store().bottomInset,
    };
  }

  function fitItems(ratio: number): FitItem[] {
    const { fontFamily } = model.palette();
    const size = model.labelSize(ratio);
    return graph.mapNodes((id, attributes) => {
      const node = layout.position(id);
      const radius = layout.radius(id);
      const showLabel = model.labelOpacity(ratio, radius) >= FIT_LABEL_OPACITY;
      return {
        x: node?.x ?? 0,
        y: node?.y ?? 0,
        radius,
        label: showLabel ? { width: measurer.width(attributes.label, size, fontFamily), height: size, gap: LABEL_GAP } : null,
      };
    });
  }

  const gestures = attachGestures(canvas, camera, {
    pick,
    hover(id) {
      if (id !== store().hoveredId) store().setHovered(id);
    },
    tap(id) {
      store().setFocused(null);
      if (id && isTagNode(id)) useSearchStore.getState().openWith(`tag:${id.slice(TAG_PREFIX.length)} `);
      else if (id) store().open(id);
      else store().close();
    },
    dragStart(id, point) {
      const node = layout.position(id);
      dragOffset = { x: (node?.x ?? point.x) - point.x, y: (node?.y ?? point.y) - point.y };
      layout.dragStart(id);
      store().setDragging(id);
      requestDraw();
    },
    dragMove(point) {
      layout.dragTo(point.x + dragOffset.x, point.y + dragOffset.y);
      requestDraw();
    },
    dragEnd() {
      layout.dragEnd();
      store().setDragging(null);
      requestDraw();
    },
    interact() {
      if (!store().interacted) store().setInteracted();
    },
    moved() {
      gestureListeners.forEach((listener) => listener());
    },
  });

  const drift = createDrift({
    allowed() {
      const { hoveredId, selectedId, focusedId, draggingId, mapHidden } = store();
      return (
        !prefersReducedMotion() &&
        !document.hidden &&
        !mapHidden &&
        !hoveredId &&
        !selectedId &&
        !focusedId &&
        !draggingId &&
        !useSearchStore.getState().open &&
        !layout.isMoving() &&
        !gestures.active()
      );
    },
    wake: schedule,
    bake: camera.bake,
  });
  const interruptDrift = () => drift.interrupt();
  for (const type of DRIFT_INPUTS) canvas.addEventListener(type, interruptDrift, { capture: true, passive: true });
  window.addEventListener("keydown", interruptDrift, { capture: true });
  settleListeners.add(interruptDrift);

  let stopWatchingRatio = () => {};
  /** A window dragged to a screen with another pixel ratio needs sharper (or lighter) canvases; size alone doesn't change. */
  function watchPixelRatio() {
    stopWatchingRatio();
    const media = window.matchMedia(`(resolution: ${pixelRatio}dppx)`);
    media.addEventListener("change", resize, { once: true });
    stopWatchingRatio = () => media.removeEventListener("change", resize);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    camera.resize(rect.width, rect.height);
    pixelRatio = window.devicePixelRatio || 1;
    for (const layer of [canvases.backdrop, canvases.effects, canvas]) {
      layer.width = Math.round(rect.width * pixelRatio);
      layer.height = Math.round(rect.height * pixelRatio);
    }
    watchPixelRatio();
    requestDraw();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const onVisibility = () => {
    drift.interrupt();
    if (!document.hidden) schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const stopMapHidden = useMapStore.subscribe((state, previous) => {
    if (state.mapHidden === previous.mapHidden) return;
    drift.interrupt();
    if (!state.mapHidden) requestDraw();
  });
  void document.fonts?.ready.then(() => {
    measurer.clear();
    requestDraw();
  });

  const listen = (listeners: Set<() => void>) => (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    restyle,
    flyTo(id, insets, animate = true) {
      const node = layout.position(id);
      if (!node) return;
      drift.interrupt();
      const shift = camera.screenOffset(insets.right / 2, insets.bottom / 2);
      camera.glide({ x: (node.x ?? 0) + shift.x, y: (node.y ?? 0) + shift.y }, animate ? undefined : 0);
    },
    reveal(id) {
      const node = layout.position(id);
      if (!node) return;
      drift.interrupt();
      const { width, height } = camera.size();
      const point = camera.toScreen(node.x ?? 0, node.y ?? 0);
      const inside =
        point.x > REVEAL_MARGIN && point.x < width - REVEAL_MARGIN && point.y > FIT_MARGIN.top && point.y < height - REVEAL_MARGIN;
      if (!inside) camera.glide({ x: node.x ?? 0, y: node.y ?? 0 });
    },
    getCamera: camera.get,
    setCamera(next, animate = true) {
      drift.interrupt();
      camera.animate(next, animate ? undefined : 0);
    },
    onCameraChange: listen(cameraListeners),
    onViewChange: listen(viewListeners),
    onSceneChange: listen(sceneListeners),
    onGestureMove: listen(gestureListeners),
    onSettle: listen(settleListeners),
    zoomBy(factor, animate = true) {
      drift.interrupt();
      const { width, height } = camera.size();
      if (!animate) return camera.zoomAround({ x: width / 2, y: height / 2 }, camera.get().ratio * factor);
      camera.glide({ ratio: camera.get().ratio * factor });
    },
    panBy(dx, dy) {
      drift.interrupt();
      camera.cancel();
      camera.panBy(dx, dy);
    },
    fit(insets, animate = true) {
      drift.interrupt();
      camera.animate(camera.fitting(fitItems, fitFrame(insets)), animate ? undefined : 0);
    },
    viewport() {
      const { width, height } = camera.size();
      return [camera.toGraph({ x: 0, y: 0 }), camera.toGraph({ x: width, y: 0 }), camera.toGraph({ x: width, y: height }), camera.toGraph({ x: 0, y: height })];
    },
    centreOn(point, animate = true) {
      drift.interrupt();
      if (animate) return camera.glide(point);
      camera.cancel();
      camera.set({ ...camera.get(), ...point });
    },
    resetZoom() {
      drift.interrupt();
      camera.glide({ ratio: 1 });
    },
    viewportPosition(id) {
      const node = layout.position(id);
      if (!node) return null;
      const rect = canvas.getBoundingClientRect();
      const point = camera.toScreen(node.x ?? 0, node.y ?? 0);
      return { x: point.x + rect.left, y: point.y + rect.top, radius: screenRadius(model.nodeStyle(id).size) };
    },
    pickAt(clientX, clientY, pointerType) {
      const rect = canvas.getBoundingClientRect();
      return pick({ x: clientX - rect.left, y: clientY - rect.top }, pointerType);
    },
    cancelGesture: gestures.cancel,
    detach() {
      detached = true;
      camera.cancel();
      drift.detach();
      for (const type of DRIFT_INPUTS) canvas.removeEventListener(type, interruptDrift, { capture: true });
      window.removeEventListener("keydown", interruptDrift, { capture: true });
      gestures.detach();
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      stopWatchingRatio();
      stopMapHidden();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
