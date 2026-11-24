"use client";

import { useState } from "react";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { SettingsPanel } from "@/features/settings/settings-panel";
import type { GraphDomain } from "@/lib/content/schema";
import { useMapStore } from "@/lib/store/map-store";

import { ControlStack } from "./control-stack";
import type { MapController } from "./map-controller";
import { MobileControls } from "./mobile-controls";
import { Navigator } from "./navigator";
import { useMapOverlay } from "./use-map-overlay";

/**
 * The map's controls, bottom-right and moved clear of the note panel: the navigator (minimap and
 * toolbar) on tablet and desktop, a narrow stack on tablets while a note is open, and a touch stack
 * with its own minimap on phones. Graph settings open above the navigator, move with it and never
 * reach past the top bar. The whole column reports itself as a map overlay.
 */
export function CanvasControls({ controller, domains }: { controller: MapController; domains: GraphDomain[] }) {
  const breakpoint = useBreakpoint();
  const offset = useMapStore((state) => (state.selectedId ? state.insets : null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleSettings = () => setSettingsOpen(!settingsOpen);
  const overlayRef = useMapOverlay("controls");

  if (breakpoint === "mobile") return <MobileControls controller={controller} />;

  return (
    <div
      ref={overlayRef}
      className="absolute right-3 bottom-3 z-overlay flex max-h-[calc(100dvh-var(--spacing-topbar)---spacing(9))] flex-col items-end gap-2 transition-transform duration-base ease-standard"
      style={offset ? { transform: `translate(${-offset.right}px, ${-offset.bottom}px)` } : undefined}
    >
      {settingsOpen && <SettingsPanel domains={domains} onClose={() => setSettingsOpen(false)} />}
      <div className="shrink-0">
        {breakpoint === "tablet" && offset ? (
          <ControlStack controller={controller} settingsOpen={settingsOpen} onToggleSettings={toggleSettings} />
        ) : (
          <Navigator controller={controller} settingsOpen={settingsOpen} onToggleSettings={toggleSettings} />
        )}
      </div>
    </div>
  );
}
