import { writeCameraSoon } from "@/features/navigation/camera-history";
import type { GraphData } from "@/lib/content/schema";
import { slugFromPath } from "@/lib/content/note-url";
import { useMapStore, type CameraRequest, type Insets } from "@/lib/store/map-store";

import { ZOOM_STEP, type Point } from "./camera";
import { createMapModel } from "./map-model";
import type { MapRenderer } from "./renderer";

const NO_INSETS: Insets = { right: 0, bottom: 0 };

/** Listeners that outlive any one renderer, so chrome can subscribe before the canvas mounts. */
function createSignal() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit: () => listeners.forEach((listener) => listener()),
  };
}

/**
 * The map's public face for React chrome (hover card, controls, keyboard, context menu). It owns
 * the model, forwards camera commands to the renderer, carries out camera requests from the store,
 * and saves the camera into the current history entry.
 */
export function createMapController(data: GraphData, domains: string[]) {
  const model = createMapModel(data, domains);
  let renderer: MapRenderer | null = null;
  const store = useMapStore;
  const signals = { camera: createSignal(), view: createSignal(), scene: createSignal(), gesture: createSignal() };

  /** The panel's insets while a note is open; nothing otherwise. */
  const openInsets = () => (store.getState().selectedId ? store.getState().insets : NO_INSETS);

  /** Makes `next` the active renderer until the returned cleanup runs. */
  function use(next: MapRenderer) {
    renderer = next;

    function apply(request: CameraRequest | null, animate: boolean) {
      if (!request) return;
      if ("node" in request.target) next.flyTo(request.target.node, store.getState().insets, animate);
      else next.setCamera(request.target.camera, animate);
    }

    /** Until the person moves the map or a camera is requested, the view keeps fitting the graph as it settles. */
    let autoFit = !store.getState().cameraRequest;
    next.fit(openInsets(), false);
    apply(store.getState().cameraRequest, false);

    /** Label widths change once the web font arrives; refit if nobody has moved the camera yet. */
    const initial = JSON.stringify(next.getCamera());
    let attached = true;
    void document.fonts?.ready.then(() => {
      if (attached && JSON.stringify(next.getCamera()) === initial && !store.getState().cameraRequest) next.fit(openInsets(), false);
    });

    const stopModel = model.start({ restyle: () => next.restyle() });
    const stopSettle = next.onSettle(() => {
      const { interacted, selectedId } = store.getState();
      if (autoFit && !interacted && !selectedId) next.fit(openInsets());
    });

    /** Closing a note gives back the room the panel took: refit if the map is untouched, else slide back by half the panel. */
    function recentre(insets: Insets) {
      if (!store.getState().interacted) return next.fit(NO_INSETS);
      const camera = next.getCamera();
      next.setCamera({ ...camera, x: camera.x - (insets.right / 2) * camera.ratio, y: camera.y - (insets.bottom / 2) * camera.ratio });
    }

    const stopStore = store.subscribe((state, previous) => {
      const requested = state.cameraRequest !== previous.cameraRequest && state.cameraRequest !== null;
      if (requested) autoFit = false;
      if (state.cameraRequest !== previous.cameraRequest) apply(state.cameraRequest, true);
      if (previous.selectedId && !state.selectedId && !requested) recentre(previous.insets);
      if (state.focusedId && state.focusedId !== previous.focusedId) next.reveal(state.focusedId);
      const overlayMoved = state.leftInset !== previous.leftInset || state.bottomInset !== previous.bottomInset;
      if (overlayMoved && !state.interacted && !state.selectedId) next.fit(openInsets());
    });

    /** A camera belongs to the entry whose URL matches the current selection. */
    const belongsHere = () => slugFromPath(window.location.pathname) === store.getState().selectedId;
    const stopCamera = next.onCameraChange(() => writeCameraSoon(next.getCamera, belongsHere));
    store.getState().setCameraReader(next.getCamera);
    const stopSignals = [
      next.onCameraChange(signals.camera.emit),
      next.onViewChange(signals.view.emit),
      next.onSceneChange(signals.scene.emit),
      next.onGestureMove(signals.gesture.emit),
    ];
    signals.camera.emit();
    signals.view.emit();
    signals.scene.emit();

    return () => {
      attached = false;
      stopModel();
      stopSettle();
      stopStore();
      stopCamera();
      stopSignals.forEach((stop) => stop());
      store.getState().setCameraReader(null);
      next.detach();
      if (renderer === next) renderer = null;
    };
  }

  const interacted = () => {
    if (!store.getState().interacted) store.getState().setInteracted();
  };

  /** Moves keyboard focus through nodes in cluster-then-title order. Returns false past either end. */
  function focusStep(direction: 1 | -1) {
    const order = model.keyboardOrder();
    const { focusedId, setFocused } = store.getState();
    const index = focusedId ? order.indexOf(focusedId) : direction === 1 ? -1 : order.length;
    const next = order[index + direction];
    if (!next) {
      setFocused(null);
      return false;
    }
    setFocused(next);
    return true;
  }

  return {
    model,
    use,
    node: model.node,
    breadcrumb: model.breadcrumb,
    keyboardOrder: model.keyboardOrder,
    viewportPosition: (id: string) => renderer?.viewportPosition(id) ?? null,
    pickAt: (clientX: number, clientY: number, pointerType: string) => renderer?.pickAt(clientX, clientY, pointerType) ?? null,
    cancelGesture: () => renderer?.cancelGesture(),
    zoomIn: (fast = false) => {
      interacted();
      renderer?.zoomBy(1 / (fast ? ZOOM_STEP ** 2 : ZOOM_STEP));
    },
    zoomOut: (fast = false) => {
      interacted();
      renderer?.zoomBy(fast ? ZOOM_STEP ** 2 : ZOOM_STEP);
    },
    panBy: (dx: number, dy: number) => {
      interacted();
      renderer?.panBy(dx, dy);
    },
    fit: () => renderer?.fit(openInsets()),
    /** Back to 100% around the screen's centre. */
    resetZoom: () => {
      interacted();
      renderer?.resetZoom();
    },
    /** Graph units per screen px (1 = 100%), without idle drift. */
    zoomRatio: () => renderer?.getCamera().ratio ?? 1,
    /** Zooms around the screen's centre at once, for wheel input from the minimap. */
    zoomByNow: (factor: number) => {
      interacted();
      renderer?.zoomBy(factor, false);
    },
    centreOn: (point: Point, animate = true) => {
      interacted();
      renderer?.centreOn(point, animate);
    },
    /** The screen's corners in graph units, drift included; null before the canvas mounts. */
    viewport: () => renderer?.viewport() ?? null,
    /** Camera moves (not drift): the zoom readout. */
    onCameraChange: signals.camera.subscribe,
    /** Anything that moves the view, drift included: the minimap's rectangle. */
    onViewChange: signals.view.subscribe,
    /** Node positions or styles changed: the minimap's notes. */
    onSceneChange: signals.scene.subscribe,
    /** A pan or pinch moved the camera: the phone minimap. */
    onGestureMove: signals.gesture.subscribe,
    focusStep,
  };
}

export type MapController = ReturnType<typeof createMapController>;
