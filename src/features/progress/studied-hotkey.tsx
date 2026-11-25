"use client";

import { useHotkey } from "@/features/keyboard/use-hotkey";
import { useMapStore } from "@/lib/store/map-store";

import { toggleStudiedNote } from "./mark-studied";

/** S marks or unmarks the open note, on the map and in the list alike. */
export function StudiedHotkey() {
  useHotkey("s", () => {
    const { selectedId } = useMapStore.getState();
    if (selectedId) toggleStudiedNote(selectedId);
  });
  return null;
}
