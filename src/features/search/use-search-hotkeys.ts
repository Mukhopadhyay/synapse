"use client";

import { useEffect } from "react";

import { useHotkey } from "@/features/keyboard/use-hotkey";

import { isPaletteShortcut } from "./palette-shortcut";
import { useSearchStore } from "./search-store";

/**
 * ⌘K / Ctrl+K anywhere (even while typing, and inside the palette, where it closes it) and / outside
 * inputs open the palette. Listens on window in the capture phase, so no other key handler on the
 * page can swallow it first. Mounted once, by the shell's palette.
 */
export function useSearchHotkeys() {
  useHotkey("/", () => useSearchStore.getState().setOpen(true));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPaletteShortcut(event)) return;
      event.preventDefault();
      const { open, setOpen } = useSearchStore.getState();
      setOpen(!open);
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);
}
