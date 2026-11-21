import { create } from "zustand";

/** Notes matching the filter box's query, or null when there's no query. Kept apart from the saved filters since it's derived. */
export const useQueryMatches = create<{ ids: Set<string> | null }>()(() => ({ ids: null }));
