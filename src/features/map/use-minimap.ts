"use client";

import { useSyncExternalStore } from "react";

import { usePrefsStore } from "@/lib/store/prefs-store";

import type { MapController } from "./map-controller";

/**
 * Whether the minimap shows, and a toggle for the button and the M key. On "auto" (the default)
 * it shows only when the graph is big enough to get lost in; toggling makes the choice explicit.
 */
export function useMinimap(controller: MapController) {
  const choice = usePrefsStore((state) => state.minimap);
  const useful = useSyncExternalStore(controller.onCameraChange, controller.minimapUseful, () => false);
  const on = choice === "auto" ? useful : choice === "on";
  const toggle = () => usePrefsStore.getState().set({ minimap: on ? "off" : "on" });
  return { on, toggle };
}
