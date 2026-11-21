"use client";

import { useSyncExternalStore } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

const MOBILE = "(max-width: 639.98px)";
const TABLET = "(max-width: 1023.98px)";

function current(): Breakpoint {
  if (window.matchMedia(MOBILE).matches) return "mobile";
  if (window.matchMedia(TABLET).matches) return "tablet";
  return "desktop";
}

function subscribe(onChange: () => void) {
  const queries = [MOBILE, TABLET].map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

/** Layout breakpoint from the spec: mobile < 640, tablet 640–1023, desktop ≥ 1024. The server renders desktop. */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, current, () => "desktop");
}
