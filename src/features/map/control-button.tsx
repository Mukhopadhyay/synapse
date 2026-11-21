"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ControlButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  pressed?: boolean;
  side?: "left" | "top";
};

/** An icon button on the map's chrome with a tooltip naming it and its key. Extra props reach the button, so it can sit in a Radix toolbar. */
export function ControlButton({ label, shortcut, icon: Icon, pressed, side = "left", ...props }: ControlButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} {...props}>
          <Icon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>
        {label} {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
