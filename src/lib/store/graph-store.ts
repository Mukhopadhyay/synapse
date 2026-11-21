import { create } from "zustand";

import type { GraphData } from "@/lib/content/schema";

/** In development, `?graph=stress` loads the generated 500-node graph (pnpm stress) for performance checks. */
function graphUrl() {
  const stress = process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("graph") === "stress";
  return stress ? "/graph.stress.json" : "/graph.json";
}

/** graph.json, loaded once and shared by the map and the note panel. */
type GraphState = {
  status: "idle" | "loading" | "error" | "ready";
  data: GraphData | null;
  /** Fetches once; after a failure, calling it again retries. */
  load: () => void;
};

export const useGraphStore = create<GraphState>()((set, get) => ({
  status: "idle",
  data: null,
  load() {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading" });
    fetch(graphUrl())
      .then((response) => {
        if (!response.ok) throw new Error(`graph.json: ${response.status}`);
        return response.json() as Promise<GraphData>;
      })
      .then((data) => set({ status: "ready", data }))
      .catch(() => set({ status: "error" }));
  },
}));
