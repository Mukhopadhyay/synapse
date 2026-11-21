"use client";

import { usePathname } from "next/navigation";

import { parseGraphPath } from "@/lib/content/note-url";
import type { GraphData } from "@/lib/content/schema";

/** The field in the URL (`/<domain>/graph…`, `/<domain>/list`), or null on routes without one (`/graph`, the all-fields map). */
export function useActiveDomain(data: GraphData | null): string | null {
  const route = parseGraphPath(usePathname());
  if (!data || !route) return null;
  return data.domains.some((domain) => domain.id === route.domain) ? route.domain : null;
}
