"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { MapController } from "./map-controller";

/** The zoom as a percentage of Fit (re-renders only when the rounded value changes); click or 0 fits the graph again. */
export function ZoomReadout({ controller, ...props }: { controller: MapController } & ComponentProps<typeof Button>) {
  const percent = useSyncExternalStore(
    controller.onCameraChange,
    controller.zoomPercent,
    () => 100,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Zoom ${percent}% of fit. Fit graph`}
          onClick={controller.fit}
          className="w-12 px-0 font-mono text-meta text-muted-foreground tabular-nums"
          {...props}
        >
          {percent}%
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Fit graph <Kbd>0</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
