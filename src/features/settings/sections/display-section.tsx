"use client";

import { SettingsSection, SliderRow, SwitchRow } from "../setting-rows";
import { DISPLAY_RANGES, useSettingsStore } from "../settings-store";

const times = (value: number) => `${value.toFixed(2)}×`;
const signed = (value: number) => (value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1));

/** Arrows, label fade and the size of nodes and links; none of these move the layout except node size. */
export function DisplaySection() {
  const display = useSettingsStore((state) => state.display);
  const setDisplay = useSettingsStore((state) => state.setDisplay);
  return (
    <SettingsSection title="Display">
      <SwitchRow label="Arrows" checked={display.arrows} onChange={(arrows) => setDisplay("arrows", arrows)} />
      <SliderRow label="Text fade threshold" value={display.textFade} range={DISPLAY_RANGES.textFade} format={signed} onChange={(value) => setDisplay("textFade", value)} />
      <SliderRow label="Node size" value={display.nodeSize} range={DISPLAY_RANGES.nodeSize} format={times} onChange={(value) => setDisplay("nodeSize", value)} />
      <SliderRow label="Link thickness" value={display.linkThickness} range={DISPLAY_RANGES.linkThickness} format={times} onChange={(value) => setDisplay("linkThickness", value)} />
    </SettingsSection>
  );
}
