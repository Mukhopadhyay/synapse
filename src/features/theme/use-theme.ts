"use client";

import { useCallback, useSyncExternalStore } from "react";

import { getServerTheme, getTheme, setTheme, subscribeTheme } from "./theme-store";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

  const toggleTheme = useCallback(() => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, setTheme, toggleTheme };
}
