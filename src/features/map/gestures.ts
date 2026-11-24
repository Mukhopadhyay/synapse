import type { CameraControl, Point } from "./camera";
import { wheelZoomFactor } from "./zoom";

/** A pointer moving less than this between press and release is a tap, not a drag or pan. */
const TAP_TOLERANCE = 4;
/** After the camera moves on its own, the mouse must travel this far before hover picks again. */
const HOVER_RESUME_DISTANCE = 2;

export type GestureHandlers = {
  /** The node under a screen point, honouring the minimum hit radius for the pointer type. */
  pick: (point: Point, pointerType: string) => string | null;
  hover: (id: string | null) => void;
  /** A press and release without moving: a node, or empty canvas (null). */
  tap: (id: string | null) => void;
  /** Graph coordinates of the pointer. */
  dragStart: (id: string, point: Point) => void;
  dragMove: (point: Point) => void;
  dragEnd: () => void;
  /** The person moved the map themselves: a pan, pinch, wheel zoom or drag began. */
  interact: () => void;
  /** A pan or pinch moved the camera. */
  moved: () => void;
};

type Gesture =
  | { kind: "press"; start: Point; id: string | null; pointerType: string }
  | { kind: "drag"; id: string }
  | { kind: "pan"; start: Point; camera: ReturnType<CameraControl["get"]> }
  | { kind: "pinch"; distance: number; ratio: number; anchor: Point };

/**
 * Pointer, touch and wheel input on the map canvas: press-and-move on a node drags it, on empty
 * canvas pans; two fingers pinch; the wheel and trackpad pinch zoom towards the cursor; a press
 * without moving is a tap. Returns `cancel` (drop the current gesture), `holdHover` and `detach`.
 */
export function attachGestures(canvas: HTMLCanvasElement, camera: CameraControl, handlers: GestureHandlers) {
  const pointers = new Map<number, Point>();
  let gesture: Gesture | null = null;
  let mouse: Point | null = null;
  /** Where the mouse rested when the camera started moving on its own; hover waits until it leaves. */
  let heldAt: Point | null = null;

  const localPoint = (event: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function startPinch() {
    if (gesture?.kind === "drag") handlers.dragEnd();
    const [a, b] = [...pointers.values()];
    const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    handlers.interact();
    gesture = { kind: "pinch", distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), ratio: camera.get().ratio, anchor: camera.toGraph(middle) };
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    camera.cancel();
    const point = localPoint(event);
    pointers.set(event.pointerId, point);
    if (event.pointerType === "mouse") mouse = point;
    if (pointers.size === 1) gesture = { kind: "press", start: point, id: handlers.pick(point, event.pointerType), pointerType: event.pointerType };
    else if (pointers.size === 2) startPinch();
  }

  function onPointerMove(event: PointerEvent) {
    const point = localPoint(event);
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point);
    if (event.pointerType === "mouse") mouse = point;

    if (gesture?.kind === "pinch" && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      camera.zoomAround(middle, (gesture.ratio * gesture.distance) / distance, gesture.anchor);
      handlers.moved();
      return;
    }

    if (gesture?.kind === "press" && pointers.has(event.pointerId)) {
      if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) < TAP_TOLERANCE) return;
      handlers.interact();
      if (gesture.id) {
        handlers.dragStart(gesture.id, camera.toGraph(gesture.start));
        gesture = { kind: "drag", id: gesture.id };
      } else {
        gesture = { kind: "pan", start: gesture.start, camera: camera.get() };
      }
    }

    if (gesture?.kind === "drag" && pointers.has(event.pointerId)) {
      handlers.dragMove(camera.toGraph(point));
      return;
    }

    if (gesture?.kind === "pan" && pointers.has(event.pointerId)) {
      camera.panFrom(gesture.camera, point.x - gesture.start.x, point.y - gesture.start.y);
      handlers.moved();
      return;
    }

    if (event.pointerType !== "mouse" || pointers.size > 0) return;
    if (heldAt && Math.hypot(point.x - heldAt.x, point.y - heldAt.y) <= HOVER_RESUME_DISTANCE) return;
    heldAt = null;
    handlers.hover(handlers.pick(point, "mouse"));
  }

  function endPointer(event: PointerEvent, cancelled: boolean) {
    const current = gesture;
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

    if (current?.kind === "press" && !cancelled && pointers.size === 0) handlers.tap(current.id);
    if (current?.kind === "drag") handlers.dragEnd();

    if (pointers.size === 1 && current?.kind === "pinch") {
      const [remaining] = [...pointers.values()];
      gesture = { kind: "pan", start: remaining, camera: camera.get() };
    } else if (pointers.size === 0) {
      gesture = null;
      if (event.pointerType === "mouse" && !heldAt) handlers.hover(handlers.pick(localPoint(event), "mouse"));
    }
  }

  const onPointerUp = (event: PointerEvent) => endPointer(event, false);
  const onPointerCancel = (event: PointerEvent) => endPointer(event, true);
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    mouse = null;
    if (pointers.size === 0) handlers.hover(null);
  };

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    camera.cancel();
    handlers.interact();
    camera.zoomAround(localPoint(event), camera.get().ratio * wheelZoomFactor(event, camera.size().height));
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return {
    /** A pointer is down on the map. */
    active: () => pointers.size > 0,
    /**
     * The camera started moving by itself (fly-to, fit, keyboard zoom), so whatever sits under a
     * resting mouse is about to change: hover waits until the mouse really moves again. Browsers
     * also send zero-distance moves when layout shifts, which would otherwise pick a new node.
     */
    holdHover() {
      heldAt = mouse;
    },
    /** Drops whatever gesture is in progress, e.g. when a long press opens the context menu. */
    cancel() {
      if (gesture?.kind === "drag") handlers.dragEnd();
      for (const id of pointers.keys()) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      pointers.clear();
      gesture = null;
    },
    detach() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
    },
  };
}
