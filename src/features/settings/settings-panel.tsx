"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { GraphDomain } from "@/lib/content/schema";

import { RestoreDefaults, SettingsSections } from "./settings-content";

/**
 * The floating graph settings panel above the map controls. It takes the height the controls leave
 * below the top bar; the title and Restore defaults stay put while the sections scroll between them.
 */
export function SettingsPanel({ domains, onClose }: { domains: GraphDomain[]; onClose: () => void }) {
  return (
    <section
      id="graph-settings"
      aria-labelledby="graph-settings-title"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
      className="floating flex min-h-0 w-72 shrink flex-col overflow-hidden animate-in fade-in-0 duration-quick"
    >
      <div className="flex h-10 shrink-0 items-center border-b border-border pr-1.5 pl-3">
        <h2 id="graph-settings-title" className="text-ui text-foreground">
          Graph settings
        </h2>
      </div>
      <ScrollArea className="flex min-h-0 flex-1 flex-col" viewportClassName="max-h-[inherit]">
        <SettingsSections domains={domains} />
      </ScrollArea>
      <div className="flex h-10 shrink-0 items-center justify-end border-t border-border px-1.5">
        <RestoreDefaults />
      </div>
    </section>
  );
}
