import { create } from "zustand";

import { sameOverlay, type MapOverlay } from "@/lib/overlays";

/** A camera position in graph units: the point at the centre of the screen and the zoom ratio (1 = 1px per unit). */
export type SavedCamera = { x: number; y: number; ratio: number };

/** Where the camera should go next: fly to a note, or restore a saved position. */
export type CameraRequest = { seq: number; target: { node: string } | { camera: SavedCamera } };

/** Screen area covered by the note panel (right on desktop and tablet, bottom on mobile), in px. */
export type Insets = { right: number; bottom: number };

/** Camera commands for controls that live outside the map, like the zoom stack riding on the phone sheet. */
export type MapCommands = { zoomIn: () => void; zoomOut: () => void; fit: () => void };

/** The bridge between React chrome and the map canvas. */
type MapState = {
  hoveredId: string | null;
  /** Hovers from panel rows and wikilinks preview the node without the hover card. */
  hoverSource: "map" | "panel";
  selectedId: string | null;
  /** The node with keyboard focus (Tab / Shift+Tab on the map). */
  focusedId: string | null;
  /** The node being dragged; hover and the hover card follow it. */
  draggingId: string | null;
  /** True once the person has panned, zoomed or dragged the map in this visit. */
  interacted: boolean;
  /** False until the URL has been read once; until then the URL alone decides what's open. */
  synced: boolean;
  /** Whether the last selection change came from the URL (load, Back, a link) or from the page; only page changes push history. */
  selectionSource: "url" | "page";
  cameraRequest: CameraRequest | null;
  insets: Insets;
  /** Floating chrome over the map by id (welcome card, legend, controls); fitting and labels keep clear of it. */
  overlays: Record<string, MapOverlay>;
  /** Reads the camera; set while the map is mounted. */
  readCamera: (() => SavedCamera) | null;
  /** Zoom and fit; set while the map is mounted. */
  commands: MapCommands | null;
  /** The map is under the list view or a document page; its animations pause. */
  mapHidden: boolean;
  setHovered: (id: string | null, source?: "map" | "panel") => void;
  setFocused: (id: string | null) => void;
  setInteracted: () => void;
  setDragging: (id: string | null) => void;
  /** Select a note and fly to it (map click, relation row, wikilink). */
  open: (id: string) => void;
  close: () => void;
  /** Mirror the URL after a load, Back or Forward, restoring that entry's camera when it has one. */
  syncFromUrl: (id: string | null, camera: SavedCamera | null) => void;
  setInsets: (insets: Insets) => void;
  /** Records where an overlay sits, or forgets it (null); unchanged boxes leave the state alone. */
  setOverlay: (id: string, overlay: MapOverlay | null) => void;
  setCameraReader: (reader: (() => SavedCamera) | null) => void;
  setCommands: (commands: MapCommands | null) => void;
  setMapHidden: (hidden: boolean) => void;
};

let seq = 0;
const request = (target: CameraRequest["target"]): CameraRequest => ({ seq: ++seq, target });

export const useMapStore = create<MapState>()((set) => ({
  hoveredId: null,
  hoverSource: "map",
  selectedId: null,
  focusedId: null,
  draggingId: null,
  interacted: false,
  synced: false,
  selectionSource: "url",
  cameraRequest: null,
  insets: { right: 0, bottom: 0 },
  overlays: {},
  readCamera: null,
  commands: null,
  mapHidden: false,
  setHovered: (hoveredId, hoverSource = "map") => set({ hoveredId, hoverSource }),
  setFocused: (focusedId) => set({ focusedId }),
  setInteracted: () => set({ interacted: true }),
  setDragging: (draggingId) => set({ draggingId }),
  open: (id) => set({ selectedId: id, synced: true, selectionSource: "page", cameraRequest: request({ node: id }) }),
  close: () => set({ selectedId: null, synced: true, selectionSource: "page" }),
  syncFromUrl: (id, camera) =>
    set({
      selectedId: id,
      synced: true,
      selectionSource: "url",
      cameraRequest: camera ? request({ camera }) : id ? request({ node: id }) : null,
    }),
  setInsets: (insets) => set({ insets }),
  setOverlay: (id, overlay) =>
    set((state) => {
      if (overlay) return sameOverlay(state.overlays[id], overlay) ? state : { overlays: { ...state.overlays, [id]: overlay } };
      if (!(id in state.overlays)) return state;
      const rest = { ...state.overlays };
      delete rest[id];
      return { overlays: rest };
    }),
  setCameraReader: (readCamera) => set({ readCamera }),
  setCommands: (commands) => set({ commands }),
  setMapHidden: (mapHidden) => set({ mapHidden }),
}));
