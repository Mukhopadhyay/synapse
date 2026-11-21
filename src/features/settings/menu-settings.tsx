"use client";

import { useMapDomains } from "@/features/navigation/use-map-domains";
import { useGraphStore } from "@/lib/store/graph-store";

import { SettingsContent } from "./settings-content";

/** Graph settings inside the phone menu sheet; same controls as the floating panel. */
export function MenuSettings() {
  const data = useGraphStore((state) => state.data);
  const domains = useMapDomains(data);
  if (!data) return null;
  return <SettingsContent domains={domains} title={<h2 className="text-overline text-faint uppercase">Graph settings</h2>} />;
}
