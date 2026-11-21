"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { Maximize, Minus, Plus, SlidersHorizontal, MapIcon } from "lucide-react";
import { Toolbar } from "radix-ui";

import { usePrefsStore } from "@/lib/store/prefs-store";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import type { MapController } from "./map-controller";
import { Minimap } from "./minimap";
import { useMinimapLinger } from "./use-minimap-linger";
import { ZoomReadout } from "./zoom-readout";

type Props = { controller: MapController; settingsOpen: boolean; onToggleSettings: () => void };

/**
 * Tablet and desktop: one floating panel with the minimap above a toolbar of zoom out, zoom
 * readout, zoom in, fit, graph settings and the minimap toggle. With the minimap off it is the
 * toolbar alone. The minimap folds away at rest: it opens upward while the camera moves (not
 * idle drift) and while the panel is hovered or keyboard-focused, then fades 1.5s later. It stays
 * folded while graph settings are open above it.
 */
export function Navigator({ controller, settingsOpen, onToggleSettings }: Props) {
  const minimap = usePrefsStore((state) => state.minimap);
  const setPrefs = usePrefsStore((state) => state.set);
  const { active, hold } = useMinimapLinger(controller.onCameraChange);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = minimap && !settingsOpen && (active || hovered || focused);

  useEffect(() => hold(hovered || focused), [hovered, focused, hold]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlur={onBlur}
      className="floating flex w-62 flex-col p-1"
    >
      {minimap && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-base ease-standard",
            open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <Minimap controller={controller} className="mb-1 aspect-[8/5] w-full rounded-control" />
          </div>
        </div>
      )}
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
