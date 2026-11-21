"use client";

import { useMemo } from "react";

import type { GraphData, GraphDomain } from "@/lib/content/schema";

import { useActiveDomain } from "./use-active-domain";

/** The fields the map is drawing: the route's field, or every field on the all-fields map. */
export function useMapDomains(data: GraphData | null): GraphDomain[] {
  const active = useActiveDomain(data);
  return useMemo(() => (data ? data.domains.filter((domain) => !active || domain.id === active) : []), [data, active]);
}
