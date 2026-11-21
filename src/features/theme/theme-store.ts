/**
 * Theme lives on <html data-theme>, set before first paint by `themeScript`.
 * Order of precedence: saved choice, then the OS preference, then dark.
 * This module is a tiny external store over that attribute for useSyncExternalStore.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "synapse-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

export const themeScript = `(function(){var t="dark";try{var s=localStorage.getItem("${STORAGE_KEY}");t=s==="light"||s==="dark"?s:matchMedia("${LIGHT_QUERY}").matches?"light":"dark"}catch(e){}document.documentElement.dataset.theme=t})()`;

const listeners = new Set<() => void>();
let stopWatchingSystem: (() => void) | null = null;

function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

function watchSystemTheme() {
  const media = matchMedia(LIGHT_QUERY);
  const onChange = () => {
    if (!readSavedTheme()) applyTheme(media.matches ? "light" : "dark");
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  stopWatchingSystem ??= watchSystemTheme();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatchingSystem?.();
      stopWatchingSystem = null;
    }
  };
}

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function getServerTheme(): Theme {
  return "dark";
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
  applyTheme(theme);
}
