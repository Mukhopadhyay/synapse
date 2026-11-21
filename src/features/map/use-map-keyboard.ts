"use client";

import { useEffect, type FocusEvent, type KeyboardEvent, type RefObject } from "react";

import { useMapStore } from "@/lib/store/map-store";

import type { MapController } from "./map-controller";

const PAN_STEP = 64;
const FAST = 4;

const PAN: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * Keyboard on the map. Anywhere outside inputs and the panel: + and − zoom, arrows pan, Shift
 * makes both faster. With the map focused, Tab and Shift+Tab walk the nodes (cluster, then
 * title) and Enter opens the focused one; past either end, focus leaves the map as usual.
 * Returns props for the map element.
 */
export function useMapKeyboard(controller: MapController, mapRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const onMap = event.target === document.body || (event.target instanceof Node && mapRef.current?.contains(event.target));
      if (!onMap) return;
      const fast = event.shiftKey;

      if (event.key === "+" || event.key === "=") controller.zoomIn(fast);
      else if (event.key === "-" || event.key === "_") controller.zoomOut(fast);
      else if (event.key in PAN) {
        const [x, y] = PAN[event.key];
        const step = PAN_STEP * (fast ? FAST : 1);
        controller.panBy(x * step, y * step);
      } else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controller, mapRef]);

  return {
    tabIndex: 0,
    onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab") {
        if (controller.focusStep(event.shiftKey ? -1 : 1)) event.preventDefault();
      } else if (event.key === "Enter") {
        const { focusedId, open } = useMapStore.getState();
        if (focusedId) open(focusedId);
      }
    },
    /** Keyboard entry lands on the first node, or the last when arriving with Shift+Tab. */
    onFocus(event: FocusEvent<HTMLElement>) {
      if (event.target !== event.currentTarget || !event.currentTarget.matches(":focus-visible")) return;
      if (useMapStore.getState().focusedId) return;
      const from = event.relatedTarget;
      const backwards = from instanceof Node && Boolean(event.currentTarget.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING);
      controller.focusStep(backwards ? -1 : 1);
    },
    onBlur(event: FocusEvent<HTMLElement>) {
      if (!event.currentTarget.contains(event.relatedTarget)) useMapStore.getState().setFocused(null);
    },
  };
}
