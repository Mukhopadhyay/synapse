import { create } from "zustand";

import { mergeStored, readStored, writeStored } from "@/lib/storage";

type Prefs = {
  legendOpen: boolean;
  hintDismissed: boolean;
  welcomeDismissed: boolean;
  /** The map's minimap, in the navigator and on phones. */
  minimap: boolean;
};

const DEFAULTS: Prefs = { legendOpen: false, hintDismissed: false, welcomeDismissed: false, minimap: true };
const STORAGE_KEY = "synapse-prefs";
const STORAGE_VERSION = 1;

type PrefsState = Prefs & {
  /** False until saved prefs are read after hydration, so first-visit UI doesn't flash for returning visitors. */
  restored: boolean;
  set: (patch: Partial<Prefs>) => void;
  /** Loads saved prefs and saves every later change; called once after hydration. */
  restore: () => () => void;
};

/** Small remembered UI choices: the legend and minimap, and which one-time hints were dismissed. */
export const usePrefsStore = create<PrefsState>()((set, _get, store) => ({
  ...DEFAULTS,
  restored: false,
  set: (patch) => set(patch),
  restore() {
    set({ ...mergeStored(DEFAULTS, readStored(STORAGE_KEY, STORAGE_VERSION)), restored: true });
    return store.subscribe(({ legendOpen, hintDismissed, welcomeDismissed, minimap }) =>
      writeStored(STORAGE_KEY, STORAGE_VERSION, { legendOpen, hintDismissed, welcomeDismissed, minimap }),
    );
  },
}));
