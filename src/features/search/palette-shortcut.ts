/** The parts of a keydown the palette shortcut looks at. */
export type ShortcutKey = Pick<KeyboardEvent, "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "repeat">;

/**
 * ⌘K or Ctrl+K. Matches the physical key too (`code` is "KeyK" on every layout), so layouts where
 * that key types another letter still open the palette. Held-down repeats and Alt or Shift
 * combinations don't count.
 */
export function isPaletteShortcut(event: ShortcutKey) {
  if (event.repeat || event.altKey || event.shiftKey) return false;
  if (!(event.metaKey || event.ctrlKey)) return false;
  return event.code === "KeyK" || event.key.toLowerCase() === "k";
}
