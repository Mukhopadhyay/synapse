"use client";

import { useEffect } from "react";

import type { GraphData } from "@/lib/content/schema";
import { isEmptyQuery, parseQuery } from "@/lib/search/query";
import { loadSearchEngine } from "@/lib/search/search-engine";

import { useFilterStore } from "./filter-store";
import { useQueryMatches } from "./query-matches";

/** Runs the filter box's query through the search engine whenever it changes. */
export function FilterQuerySync({ data }: { data: GraphData }) {
  const query = useFilterStore((state) => state.query);

  useEffect(() => {
    const parsed = parseQuery(query);
    if (isEmptyQuery(parsed)) {
      useQueryMatches.setState({ ids: null });
      return;
    }
    let cancelled = false;
    void loadSearchEngine(data).then((engine) => {
      if (!cancelled) useQueryMatches.setState({ ids: new Set(engine.search(parsed).map((node) => node.id)) });
    });
    return () => {
      cancelled = true;
    };
  }, [data, query]);

  return null;
}
