"use client";

import { FORCE_RANGES, type ForceSettings } from "@/lib/graph/forces";

import { SettingsSection, SliderRow } from "../setting-rows";
import { useSettingsStore } from "../settings-store";

const FORCES: { key: keyof ForceSettings; label: string; digits: number }[] = [
  { key: "center", label: "Centre force", digits: 2 },
  { key: "repel", label: "Repel force", digits: 1 },
  { key: "link", label: "Link force", digits: 2 },
  { key: "distance", label: "Link distance", digits: 0 },
];

/** Obsidian's four physics sliders; the live layout wakes on every change. */
export function ForcesSection() {
  const forces = useSettingsStore((state) => state.forces);
  const setForce = useSettingsStore((state) => state.setForce);
  return (
    <SettingsSection title="Forces">
      {FORCES.map(({ key, label, digits }) => (
        <SliderRow key={key} label={label} value={forces[key]} range={FORCE_RANGES[key]} format={(value) => value.toFixed(digits)} onChange={(value) => setForce(key, value)} />
      ))}
    </SettingsSection>
  );
}
