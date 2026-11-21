"use client";

import type { MouseEvent } from "react";

import { useMapStore } from "@/lib/store/map-store";

const opensElsewhere = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/** Opens a note in place, keeping new-tab clicks native. */
export function openNote(event: MouseEvent, id: string) {
  if (opensElsewhere(event)) return;
  event.preventDefault();
  const { setHovered, open } = useMapStore.getState();
  setHovered(null);
  open(id);
}

/**
 * Every element naming a note behaves the same: hover or focus previews its node on the map,
 * click flies there and opens it. Returns handlers for a note link.
 */
export function useNoteLink(id: string) {
  const preview = () => useMapStore.getState().setHovered(id, "panel");
  const clear = () => {
    const { hoveredId, setHovered } = useMapStore.getState();
    if (hoveredId === id) setHovered(null);
  };
  return {
    onClick: (event: MouseEvent) => openNote(event, id),
    onMouseEnter: preview,
    onMouseLeave: clear,
    onFocus: preview,
    onBlur: clear,
  };
}
