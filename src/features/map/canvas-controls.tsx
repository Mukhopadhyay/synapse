"use client";

import { useState } from "react";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { SettingsContent } from "@/features/settings/settings-content";
import type { GraphDomain } from "@/lib/content/schema";
import { useMapStore } from "@/lib/store/map-store";

import { ControlStack } from "./control-stack";
import type { MapController } from "./map-controller";
import { MobileControls } from "./mobile-controls";
import { Navigator } from "./navigator";

/**
 * The map's controls, bottom-right and moved clear of the note panel: the navigator (minimap and
 * toolbar) on tablet and desktop, a narrow stack on tablets while a note is open, and a touch stack
 * with its own minimap on phones. Graph settings open above the navigator and move with it.
 */
export function CanvasControls({ controller, domains }: { controller: MapController; domains: GraphDomain[] }) {
  const breakpoint = useBreakpoint();
  const offset = useMapStore((state) => (state.selectedId ? state.insets : null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleSettings = () => setSettingsOpen(!settingsOpen);

  if (breakpoint === "mobile") return <MobileControls controller={controller} />;

  return (
    <div
      className="absolute right-3 bottom-3 z-overlay flex flex-col items-end gap-2 transition-transform duration-base ease-standard"
      style={offset ? { transform: `translate(${-offset.right}px, ${-offset.bottom}px)` } : undefined}
    >
      {settingsOpen && (
        <section
          id="graph-settings"
          aria-label="Graph settings"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            setSettingsOpen(false);
          }}
          className="floating scroll-quiet max-h-[calc(100dvh-15rem)] w-72 overflow-y-auto animate-in fade-in-0 duration-quick"
        >
          <SettingsContent domains={domains} title={<h2 className="text-ui text-foreground">Graph settings</h2>} />
        </section>
      )}
      {breakpoint === "tablet" && offset ? (
        <ControlStack controller={controller} settingsOpen={settingsOpen} onToggleSettings={toggleSettings} />
      ) : (
        <Navigator controller={controller} settingsOpen={settingsOpen} onToggleSettings={toggleSettings} />
      )}
    </div>
  );
}
