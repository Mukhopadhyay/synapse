"use client";

import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/features/filters/filter-store";
import type { GraphDomain } from "@/lib/content/schema";

import { DisplaySection } from "./sections/display-section";
import { FiltersSection } from "./sections/filters-section";
import { ForcesSection } from "./sections/forces-section";
import { GroupsSection } from "./sections/groups-section";
import { useSettingsStore } from "./settings-store";

/** Every graph setting, in Obsidian's order. Shared by the floating panel and the phone menu sheet. */
export function SettingsContent({ domains, title }: { domains: GraphDomain[]; title?: React.ReactNode }) {
  function restoreDefaults() {
    useSettingsStore.getState().reset();
    useFilterStore.getState().reset();
  }

  return (
    <div className="flex flex-col">
      <div className="flex h-10 items-center justify-between gap-2 pr-1.5 pl-3">
        {title}
        <Button variant="ghost" onClick={restoreDefaults} className="ml-auto h-7 px-2 text-ui-small">
          Restore defaults
        </Button>
      </div>
      <FiltersSection domains={domains} />
      <GroupsSection />
      <DisplaySection />
      <ForcesSection />
    </div>
  );
}
