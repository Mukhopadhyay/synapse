import type { Insets } from "@/lib/store/map-store";

import type { Camera, Point } from "./camera";

export type { Camera, Point };

/** What the controller and the React chrome need from the canvas renderer. */
export type MapRenderer = {
  /** Redraw after a colour, opacity or size change. */
  restyle: () => void;
  /** Centre a node in the area the panel leaves visible, keeping the zoom. */
  flyTo: (id: string, insets: Insets, animate?: boolean) => void;
  /** Pan just enough to bring a node on screen (keyboard focus). */
  reveal: (id: string) => void;
  getCamera: () => Camera;
  setCamera: (camera: Camera, animate?: boolean) => void;
  /** Called on every camera move (pan, zoom, flight), not on idle drift. Returns an unsubscribe. */
  onCameraChange: (listener: () => void) => () => void;
  /** Called whenever what's on screen moves: camera moves and idle drift. Returns an unsubscribe. */
  onViewChange: (listener: () => void) => () => void;
  /** Called after a redraw caused by node positions or styles (layout, filters, selection, theme). Returns an unsubscribe. */
  onSceneChange: (listener: () => void) => () => void;
  /** Called while a pan or pinch moves the camera. Returns an unsubscribe. */
  onGestureMove: (listener: () => void) => () => void;
  /** The screen's four corners in graph units (top-left, top-right, bottom-right, bottom-left), drift included. */
  viewport: () => Point[];
  /** Centres the camera on a graph point, keeping the zoom. */
  centreOn: (point: Point, animate?: boolean) => void;
  /** Back to 100% around the screen's centre. */
  resetZoom: () => void;
  /** Called each time the live layout comes to rest. Returns an unsubscribe. */
  onSettle: (listener: () => void) => () => void;
  zoomBy: (factor: number, animate?: boolean) => void;
  /** Pan by screen px. */
  panBy: (dx: number, dy: number) => void;
  /** Show the whole graph, labels included, in the area the panel leaves visible. */
  fit: (insets: Insets, animate?: boolean) => void;
  /** Where a node sits on screen, for HTML overlays like the hover card. */
  viewportPosition: (id: string) => { x: number; y: number; radius: number } | null;
  /** The node under a viewport point, for the context menu. */
  pickAt: (clientX: number, clientY: number, pointerType: string) => string | null;
  /** Drop the gesture in progress (a long press opened the context menu). */
  cancelGesture: () => void;
  detach: () => void;
};
