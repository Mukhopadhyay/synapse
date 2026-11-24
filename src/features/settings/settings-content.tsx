"use client";

import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/features/filters/filter-store";
import type { GraphDomain } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

import { DisplaySection } from "./sections/display-section";
import { FiltersSection } from "./sections/filters-section";
import { ForcesSection } from "./sections/forces-section";
import { GroupsSection } from "./sections/groups-section";
import { useSettingsStore } from "./settings-store";

/** Resets graph settings and filters together. */
export function RestoreDefaults({ className }: { className?: string }) {
  function restoreDefaults() {
    useSettingsStore.getState().reset();
    useFilterStore.getState().reset();
  }

  return (
    <Button variant="ghost" onClick={restoreDefaults} className={cn("h-7 px-2 text-ui-small", className)}>
      Restore defaults
    </Button>
  );
}

/** Every graph setting section, in Obsidian's order. */
export function SettingsSections({ domains }: { domains: GraphDomain[] }) {
  return (
    <>
      <FiltersSection domains={domains} />
      <GroupsSection />
      <DisplaySection />
      <ForcesSection />
    </>
  );
}

/** The title and Restore defaults over every section, for the phone menu sheet (which scrolls as a whole). */
export function SettingsContent({ domains, title }: { domains: GraphDomain[]; title?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex h-10 items-center justify-between gap-2 pr-1.5 pl-3">
        {title}
        <RestoreDefaults className="ml-auto" />
      </div>
      <SettingsSections domains={domains} />
    </div>
  );
}
