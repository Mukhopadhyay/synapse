"use client";

import { Maximize, Minus, Plus, SlidersHorizontal } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { ControlButton } from "./control-button";
import type { MapController } from "./map-controller";

type Props = { controller: MapController; settingsOpen: boolean; onToggleSettings: () => void };

/** Zoom, fit and graph settings as a narrow vertical stack, for tablets while a note takes the right side. */
export function ControlStack({ controller, settingsOpen, onToggleSettings }: Props) {
  return (
    <div className="floating flex flex-col gap-1 p-1">
      <ControlButton label="Zoom in" shortcut="+" icon={Plus} onClick={() => controller.zoomIn()} />
      <ControlButton label="Zoom out" shortcut="−" icon={Minus} onClick={() => controller.zoomOut()} />
      <ControlButton label="Fit graph" shortcut="F" icon={Maximize} onClick={controller.fit} />
      <Separator className="mx-auto data-[orientation=horizontal]:w-6" />
      <ControlButton
        label="Graph settings"
        icon={SlidersHorizontal}
        pressed={settingsOpen}
        aria-controls={settingsOpen ? "graph-settings" : undefined}
        onClick={onToggleSettings}
      />
    </div>
  );
}
