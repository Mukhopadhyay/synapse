import { create } from "zustand";

import { clampPanelWidth, PANEL_WIDTH } from "./panel-size";

const STORAGE_KEY = "synapse-panel-width";

/** Desktop panel width, remembered in localStorage. Storage can throw (private mode), so every access is guarded. */
type PanelState = {
  width: number;
  setWidth: (width: number) => void;
  /** Persists the current width; called when a drag or key press ends. */
  save: () => void;
  /** Reads the saved width; called once after hydration so server and client first renders match. */
  restore: () => void;
};

export const usePanelStore = create<PanelState>()((set, get) => ({
  width: PANEL_WIDTH.default,
  setWidth: (width) => set({ width: clampPanelWidth(width) }),
  save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(get().width));
    } catch {}
  },
  restore() {
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY));
      if (saved) set({ width: clampPanelWidth(saved) });
    } catch {}
  },
}));
