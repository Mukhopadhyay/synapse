"use client";

import { useEffect } from "react";

import { useMapStore } from "@/lib/store/map-store";
import { usePrefsStore } from "@/lib/store/prefs-store";

/** "Drag to pan · Scroll to zoom", bottom-centre, until the person first moves the map; then it's gone for good. */
export function MapHint() {
  const interacted = useMapStore((state) => state.interacted);
  const noteOpen = useMapStore((state) => state.selectedId !== null);
  const { restored, hintDismissed, set } = usePrefsStore();

  useEffect(() => {
    if (interacted && restored && !hintDismissed) set({ hintDismissed: true });
  }, [interacted, restored, hintDismissed, set]);

  if (!restored || hintDismissed || interacted || noteOpen) return null;
  return (
    <p className="floating pointer-events-none absolute bottom-3 left-1/2 z-overlay flex h-8 -translate-x-1/2 items-center gap-3 px-3 text-ui-small font-normal whitespace-nowrap text-faint animate-in fade-in-0 duration-quick max-sm:hidden">
      <span>Drag to pan</span>
      <span aria-hidden>·</span>
      <span>Scroll to zoom</span>
    </p>
  );
}
