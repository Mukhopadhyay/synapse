"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { MapController } from "./map-controller";

/** The current zoom as a percentage (re-renders only when the rounded value changes); click or 0 resets to 100%. */
export function ZoomReadout({ controller, ...props }: { controller: MapController } & ComponentProps<typeof Button>) {
  const percent = useSyncExternalStore(
    controller.onCameraChange,
    () => Math.round(100 / controller.zoomRatio()),
    () => 100,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`${percent}%, reset zoom to 100%`}
          onClick={controller.resetZoom}
          className="w-12 px-0 font-mono text-meta text-muted-foreground tabular-nums"
          {...props}
        >
          {percent}%
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Reset to 100% <Kbd>0</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
