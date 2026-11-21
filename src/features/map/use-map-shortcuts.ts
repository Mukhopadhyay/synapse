"use client";

import { useHotkey } from "@/features/keyboard/use-hotkey";
import { usePrefsStore } from "@/lib/store/prefs-store";

import type { MapController } from "./map-controller";

/** Single-key map shortcuts: F fits the graph, 0 resets the zoom to 100%, M shows or hides the minimap. */
export function useMapShortcuts(controller: MapController) {
  useHotkey("f", controller.fit);
  useHotkey("0", controller.resetZoom);
  useHotkey("m", () => {
    const { minimap, set } = usePrefsStore.getState();
    set({ minimap: !minimap });
  });
}
