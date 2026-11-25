import { create } from "zustand";

import { readFocus, readStudied, setStudied as withStudied, toggleStudied } from "@/lib/progress/ops";
import type { Focus, Progress } from "@/lib/progress/types";
import { useGraphStore } from "@/lib/store/graph-store";
import { readStored, storageWorks, writeStored } from "@/lib/storage";

const STORAGE_KEY = "synapse-progress";
const STORAGE_VERSION = 1;

type ProgressState = Progress & {
  /** `studied`'s slugs as a Set, rebuilt on change, so the map's per-frame lookups are O(1). */
  studiedSet: ReadonlySet<string>;
  /** False until saved progress is read after hydration, so returning visitors never see a flash of 0%. */
  restored: boolean;
  /** False when the browser refuses to save site data; ticking still works for the session. */
  persisted: boolean;
  toggle: (slug: string) => void;
  setStudied: (slug: string, on: boolean) => void;
  setFocus: (focus: Focus | null) => void;
  reset: () => void;
  /** Loads saved progress, saves every later change and follows other tabs; called once after hydration. */
  restore: () => () => void;
};

/** Ghosts have nothing to read, so they can't be studied; slugs the map doesn't know are let through only by import. */
function canStudy(slug: string) {
  const node = useGraphStore.getState().data?.nodes.find((entry) => entry.id === slug);
  return !!node && !node.ghost;
}

const withSet = (studied: Progress["studied"]) => ({ studied, studiedSet: new Set(Object.keys(studied)) });

/**
 * Which notes are studied and what is in focus. Separate from filters, prefs and settings on
 * purpose: "Restore defaults" never touches it, only Reset in the Revise panel does.
 */
export const useProgressStore = create<ProgressState>()((set, get, store) => ({
  ...withSet({}),
  focus: null,
  restored: false,
  persisted: true,
  toggle(slug) {
    if (!canStudy(slug)) return;
    set(withSet(toggleStudied(get().studied, slug)));
  },
  setStudied(slug, on) {
    if (on && !canStudy(slug)) return;
    set(withSet(withStudied(get().studied, slug, on)));
  },
  setFocus: (focus) => set({ focus }),
  reset: () => set({ ...withSet({}), focus: null }),
  restore() {
    const load = () => {
      const stored = readStored(STORAGE_KEY, STORAGE_VERSION) as { studied?: unknown; focus?: unknown } | null;
      set({ ...withSet(readStudied(stored?.studied)), focus: readFocus(stored?.focus) });
    };
    load();
    set({ restored: true, persisted: storageWorks() });

    const stopSaving = store.subscribe((state, previous) => {
      if (state.studied === previous.studied && state.focus === previous.focus) return;
      writeStored(STORAGE_KEY, STORAGE_VERSION, { studied: state.studied, focus: state.focus });
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      stopSaving();
      window.removeEventListener("storage", onStorage);
    };
  },
}));
