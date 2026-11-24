"use client";

import { useCallback } from "react";

import { overlayFromLayout } from "@/lib/overlays";
import { useMapStore } from "@/lib/store/map-store";

/** Children marked with this attribute (the navigator's minimap, which opens while the camera moves) don't count towards the overlay's size. */
export const TRANSIENT_OVERLAY = { "data-overlay-transient": "" } as const;

/**
 * A callback ref for floating chrome over the map: while the element is mounted it reports its
 * corner and size to the map store, so fitting and labels keep clear of it. Layout boxes ignore
 * transforms, so the controls sliding beside the note panel don't count as a move.
 */
export function useMapOverlay(id: string) {
  return useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const { setOverlay } = useMapStore.getState();
      const measure = () => {
        const parent = element.offsetParent;
        if (!(parent instanceof HTMLElement)) return setOverlay(id, null);
        let transient = 0;
        element.querySelectorAll<HTMLElement>("[data-overlay-transient]").forEach((child) => (transient += child.offsetHeight));
        const overlay = overlayFromLayout(
          { left: element.offsetLeft, top: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight },
          { width: parent.clientWidth, height: parent.clientHeight },
        );
        setOverlay(id, { ...overlay, height: Math.max(0, overlay.height - transient) });
      };
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => {
        observer.disconnect();
        setOverlay(id, null);
      };
    },
    [id],
  );
}
