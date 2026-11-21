import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPaletteShortcut, type ShortcutKey } from "../src/features/search/palette-shortcut.ts";

const press = (overrides: Partial<ShortcutKey>): ShortcutKey => ({
  key: "k",
  code: "KeyK",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  repeat: false,
  ...overrides,
});

describe("palette shortcut", () => {
  it("opens on ⌘K and Ctrl+K", () => {
    assert.equal(isPaletteShortcut(press({ metaKey: true })), true);
    assert.equal(isPaletteShortcut(press({ ctrlKey: true })), true);
    assert.equal(isPaletteShortcut(press({ metaKey: true, key: "K" })), true);
  });

  it("matches the physical key on other layouts", () => {
    assert.equal(isPaletteShortcut(press({ ctrlKey: true, key: "л" })), true);
    assert.equal(isPaletteShortcut(press({ metaKey: true, key: "t" })), true);
  });

  it("ignores repeats, plain K and other modifiers", () => {
    assert.equal(isPaletteShortcut(press({ metaKey: true, repeat: true })), false);
    assert.equal(isPaletteShortcut(press({})), false);
    assert.equal(isPaletteShortcut(press({ metaKey: true, shiftKey: true })), false);
    assert.equal(isPaletteShortcut(press({ ctrlKey: true, altKey: true })), false);
    assert.equal(isPaletteShortcut(press({ ctrlKey: true, key: "j", code: "KeyJ" })), false);
  });
});
