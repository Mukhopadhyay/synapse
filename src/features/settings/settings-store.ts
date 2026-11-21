import { create } from "zustand";

import { DOMAIN_COLORS, type DomainColor } from "@/lib/content/relations";
import { FORCE_DEFAULTS, type ForceSettings } from "@/lib/graph/forces";
import { mergeStored, readStored, writeStored } from "@/lib/storage";

export type DisplaySettings = {
  /** Arrowheads on every directed edge, not only around the hovered or selected note. */
  arrows: boolean;
  /** Where labels fade out as you zoom out: lower hides them sooner, higher keeps them longer. */
  textFade: number;
  /** Multiplies every node's radius. */
  nodeSize: number;
  /** Multiplies every edge's width. */
  linkThickness: number;
};

export const DISPLAY_DEFAULTS: DisplaySettings = { arrows: false, textFade: 0, nodeSize: 1, linkThickness: 1 };

export const DISPLAY_RANGES = {
  textFade: { min: -3, max: 3, step: 0.1 },
  nodeSize: { min: 0.3, max: 3, step: 0.05 },
  linkThickness: { min: 0.3, max: 3, step: 0.05 },
} as const;

/** Notes matching `query` (search syntax) are drawn in `color`; the first matching group wins. */
export type Group = { id: string; query: string; color: DomainColor };

const STORAGE_KEY = "synapse-graph-settings";
/** Bump when the stored shape or defaults change; older saved values are then ignored. */
const STORAGE_VERSION = 1;

type SettingsState = {
  forces: ForceSettings;
  display: DisplaySettings;
  groups: Group[];
  setForce: <K extends keyof ForceSettings>(key: K, value: ForceSettings[K]) => void;
  setDisplay: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  addGroup: () => void;
  updateGroup: (id: string, patch: Partial<Omit<Group, "id">>) => void;
  removeGroup: (id: string) => void;
  reset: () => void;
  /** Loads saved settings and saves every later change; called once after hydration. */
  restore: () => () => void;
};

const isGroup = (value: unknown): value is Group => {
  const group = value as Group;
  return typeof group?.id === "string" && typeof group.query === "string" && DOMAIN_COLORS.includes(group.color);
};

let groupSeq = 0;

/** Graph settings, read live by the map: forces by the simulation, display values and groups by the model and renderer. */
export const useSettingsStore = create<SettingsState>()((set, get, store) => ({
  forces: FORCE_DEFAULTS,
  display: DISPLAY_DEFAULTS,
  groups: [],
  setForce: (key, value) => set((state) => ({ forces: { ...state.forces, [key]: value } })),
  setDisplay: (key, value) => set((state) => ({ display: { ...state.display, [key]: value } })),
  addGroup() {
    const { groups } = get();
    const color = DOMAIN_COLORS[(groups.length + 1) % DOMAIN_COLORS.length];
    set({ groups: [...groups, { id: `g${Date.now().toString(36)}${groupSeq++}`, query: "", color }] });
  },
  updateGroup: (id, patch) => set({ groups: get().groups.map((group) => (group.id === id ? { ...group, ...patch } : group)) }),
  removeGroup: (id) => set({ groups: get().groups.filter((group) => group.id !== id) }),
  reset: () => set({ forces: FORCE_DEFAULTS, display: DISPLAY_DEFAULTS, groups: [] }),
  restore() {
    const stored = readStored(STORAGE_KEY, STORAGE_VERSION) as { forces?: unknown; display?: unknown; groups?: unknown } | null;
    set({
      forces: mergeStored(FORCE_DEFAULTS, stored?.forces),
      display: mergeStored(DISPLAY_DEFAULTS, stored?.display),
      groups: Array.isArray(stored?.groups) ? stored.groups.filter(isGroup) : [],
    });
    return store.subscribe(({ forces, display, groups }) => writeStored(STORAGE_KEY, STORAGE_VERSION, { forces, display, groups }));
  },
}));
