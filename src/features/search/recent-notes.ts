import { create } from "zustand";

import { useMapStore } from "@/lib/store/map-store";
import { readStored, writeStored } from "@/lib/storage";

const STORAGE_KEY = "synapse-recent";
const STORAGE_VERSION = 1;
const LIMIT = 5;

/** Notes opened lately, newest first; the palette lists them when its box is empty. */
export const useRecentNotes = create<{ ids: string[] }>()(() => ({ ids: [] }));

/** Loads the list and records every note that opens from now on; called once after hydration. */
export function trackRecentNotes() {
  const stored = readStored(STORAGE_KEY, STORAGE_VERSION);
  if (Array.isArray(stored)) useRecentNotes.setState({ ids: stored.filter((id): id is string => typeof id === "string").slice(0, LIMIT) });

  return useMapStore.subscribe((state, previous) => {
    const id = state.selectedId;
    if (!id || id === previous.selectedId) return;
    const ids = [id, ...useRecentNotes.getState().ids.filter((entry) => entry !== id)].slice(0, LIMIT);
    useRecentNotes.setState({ ids });
    writeStored(STORAGE_KEY, STORAGE_VERSION, ids);
  });
}
