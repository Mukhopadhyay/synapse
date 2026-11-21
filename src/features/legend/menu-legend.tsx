"use client";

import { useMapDomains } from "@/features/navigation/use-map-domains";
import { useGraphStore } from "@/lib/store/graph-store";

import { LegendContent } from "./legend-content";

/** The legend inside the phone menu sheet; same rows and toggles as the floating card. */
export function MenuLegend() {
  const data = useGraphStore((state) => state.data);
  const domains = useMapDomains(data);
  if (!data) return null;
  return (
    <div className="border-b border-border px-3 py-4">
      <LegendContent domains={domains} />
    </div>
  );
}
