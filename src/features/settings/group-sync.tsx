"use client";

import { useEffect } from "react";

import type { DomainColor } from "@/lib/content/relations";
import type { GraphData } from "@/lib/content/schema";
import { isEmptyQuery, parseQuery } from "@/lib/search/query";
import { loadSearchEngine } from "@/lib/search/search-engine";

import { useGroupColors } from "./group-colors";
import { useSettingsStore } from "./settings-store";

/** Runs each group's query through the search engine and records which colour every note gets. */
export function GroupSync({ data }: { data: GraphData }) {
  const groups = useSettingsStore((state) => state.groups);

  useEffect(() => {
    const active = groups.map((group) => ({ ...group, parsed: parseQuery(group.query) })).filter((group) => !isEmptyQuery(group.parsed));
    if (active.length === 0) {
      useGroupColors.setState({ colors: new Map() });
      return;
    }
    let cancelled = false;
    void loadSearchEngine(data).then((engine) => {
      if (cancelled) return;
      const colors = new Map<string, DomainColor>();
      for (const group of active) {
        for (const node of engine.search(group.parsed)) if (!colors.has(node.id)) colors.set(node.id, group.color);
      }
      useGroupColors.setState({ colors });
    });
    return () => {
      cancelled = true;
    };
  }, [data, groups]);

  return null;
}
