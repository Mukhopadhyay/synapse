"use client";

import { useHotkey } from "@/features/keyboard/use-hotkey";

import type { MapController } from "./map-controller";
import { useMinimap } from "./use-minimap";

/** Single-key map shortcuts: F and 0 fit the graph, M shows or hides the minimap. */
export function useMapShortcuts(controller: MapController) {
  const { toggle } = useMinimap(controller);
  useHotkey("f", controller.fit);
  useHotkey("0", controller.fit);
  useHotkey("m", toggle);
}
