import { create } from "zustand";

import { EDGE_KINDS, edgeDefinition, type EdgeKind, type Level } from "@/lib/content/relations";
import { mergeStored, readStored, writeStored } from "@/lib/storage";

export type Filters = {
  /** Fields switched off on the all-fields map. */
  hiddenDomains: string[];
  /** Clusters switched off, as `<domain>/<cluster>` (the map's colour key). */
  hiddenClusters: string[];
  edges: Record<EdgeKind, boolean>;
  /** Notes nobody has written yet. */
  ghosts: boolean;
  /** Notes with no relations. */
  orphans: boolean;
  /** Each tag drawn as its own node, linked to its notes. */
  tags: boolean;
  hiddenLevels: Level[];
  /** Search syntax (`tag:rag level:advanced chunk`); only matching notes stay on the map. */
  query: string;
};

export const FILTER_DEFAULTS: Filters = {
  hiddenDomains: [],
  hiddenClusters: [],
  edges: Object.fromEntries(EDGE_KINDS.map((kind) => [kind, !edgeDefinition(kind).hiddenByDefault])) as Record<EdgeKind, boolean>,
  ghosts: true,
  orphans: true,
  tags: false,
  hiddenLevels: [],
  query: "",
};

const STORAGE_KEY = "synapse-filters";
const STORAGE_VERSION = 1;

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);

type FilterState = Filters & {
  toggleDomain: (id: string) => void;
  toggleCluster: (key: string) => void;
  toggleEdge: (kind: EdgeKind) => void;
  toggleLevel: (level: Level) => void;
  set: (patch: Partial<Filters>) => void;
  reset: () => void;
  /** Loads saved filters and saves every later change; called once after hydration. */
  restore: () => () => void;
};

/** What the map shows. The legend and the settings panel both read and write this one store. */
export const useFilterStore = create<FilterState>()((set, get, store) => ({
  ...FILTER_DEFAULTS,
  toggleDomain: (id) => set({ hiddenDomains: toggle(get().hiddenDomains, id) }),
  toggleCluster: (key) => set({ hiddenClusters: toggle(get().hiddenClusters, key) }),
  toggleEdge: (kind) => set({ edges: { ...get().edges, [kind]: !get().edges[kind] } }),
  toggleLevel: (level) => set({ hiddenLevels: toggle(get().hiddenLevels, level) }),
  set: (patch) => set(patch),
  reset: () => set(FILTER_DEFAULTS),
  restore() {
    set(mergeStored(FILTER_DEFAULTS, readStored(STORAGE_KEY, STORAGE_VERSION)));
    return store.subscribe((state) => {
      const { hiddenDomains, hiddenClusters, edges, ghosts, orphans, tags, hiddenLevels, query } = state;
      writeStored(STORAGE_KEY, STORAGE_VERSION, { hiddenDomains, hiddenClusters, edges, ghosts, orphans, tags, hiddenLevels, query });
    });
  },
}));
