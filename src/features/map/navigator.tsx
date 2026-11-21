"use client";

import { Maximize, Minus, Plus, SlidersHorizontal, MapIcon } from "lucide-react";
import { Toolbar } from "radix-ui";

import { usePrefsStore } from "@/lib/store/prefs-store";

import { ControlButton } from "./control-button";
import type { MapController } from "./map-controller";
import { Minimap } from "./minimap";
import { ZoomReadout } from "./zoom-readout";

type Props = { controller: MapController; settingsOpen: boolean; onToggleSettings: () => void };

/**
 * Tablet and desktop: one floating panel with the minimap above a toolbar of zoom out, zoom
 * readout, zoom in, fit, graph settings and the minimap toggle. With the minimap off it is the
 * toolbar alone.
 */
export function Navigator({ controller, settingsOpen, onToggleSettings }: Props) {
  const minimap = usePrefsStore((state) => state.minimap);
  const setPrefs = usePrefsStore((state) => state.set);

  return (
    <div className="floating flex w-62 flex-col gap-1 p-1">
      {minimap && <Minimap controller={controller} className="aspect-[8/5] w-full rounded-control" />}
      <Toolbar.Root aria-label="Map controls" className="flex items-center gap-0.5">
        <Toolbar.Button asChild>
          <ControlButton side="top" label="Zoom out" shortcut="−" icon={Minus} onClick={() => controller.zoomOut()} />
        </Toolbar.Button>
        <Toolbar.Button asChild>
          <ZoomReadout controller={controller} />
        </Toolbar.Button>
        <Toolbar.Button asChild>
          <ControlButton side="top" label="Zoom in" shortcut="+" icon={Plus} onClick={() => controller.zoomIn()} />
        </Toolbar.Button>
        <Toolbar.Button asChild>
          <ControlButton side="top" label="Fit graph" shortcut="F" icon={Maximize} onClick={controller.fit} />
        </Toolbar.Button>
        <span aria-hidden className="flex-1" />
        <Toolbar.Button asChild>
          <ControlButton
            side="top"
            label="Graph settings"
            icon={SlidersHorizontal}
            pressed={settingsOpen}
            aria-controls={settingsOpen ? "graph-settings" : undefined}
            onClick={onToggleSettings}
          />
        </Toolbar.Button>
        <Toolbar.Button asChild>
          <ControlButton side="top" label="Minimap" shortcut="M" icon={MapIcon} pressed={minimap} onClick={() => setPrefs({ minimap: !minimap })} />
        </Toolbar.Button>
      </Toolbar.Root>
    </div>
  );
}
