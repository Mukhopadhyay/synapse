"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/features/keyboard/use-hotkey";
import { cn } from "@/lib/utils";

import { useTheme } from "./use-theme";

/**
 * The theme switch in the bar (one instance at every width); also bound to the T key. It shows the
 * theme it switches to: a sun in dark, a moon in light. The icon follows `data-theme` in CSS, which
 * is set before first paint, so a reload never flashes the wrong one.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  useHotkey("t", toggleTheme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Switch to ${next} theme`} onClick={toggleTheme} className={cn(className)}>
          <Sun aria-hidden className="hidden dark:block" />
          <Moon aria-hidden className="dark:hidden" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Switch to {next} theme <Kbd>T</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
