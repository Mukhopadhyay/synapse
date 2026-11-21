"use client";

import { ChevronDown, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GraphDomain } from "@/lib/content/schema";
import { usePrefsStore } from "@/lib/store/prefs-store";

import { groupsHeading, LegendContent, LegendHeading } from "./legend-content";

/**
 * Bottom-left on tablet and desktop: a "Legend" button that opens into a card of toggles.
 * Collapsed by default; the choice is remembered. Phones get the same content in the menu sheet.
 */
export function Legend({ domains }: { domains: GraphDomain[] }) {
  const open = usePrefsStore((state) => state.legendOpen);
  const setPrefs = usePrefsStore((state) => state.set);

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="floating absolute bottom-3 left-3 z-overlay h-8 gap-2 px-3 text-ui text-foreground max-sm:hidden"
        aria-expanded={false}
        onClick={() => setPrefs({ legendOpen: true })}
      >
        <Layers aria-hidden />
        Legend
      </Button>
    );
  }

  return (
    <section aria-label="Legend" className="floating absolute bottom-3 left-3 z-overlay w-58 p-3 pb-2 max-sm:hidden">
      <LegendContent
        domains={domains}
        header={
          <div className="flex h-6 items-center justify-between">
            <LegendHeading>{groupsHeading(domains)}</LegendHeading>
            <Button variant="ghost" size="icon" className="size-6" aria-label="Collapse legend" aria-expanded onClick={() => setPrefs({ legendOpen: false })}>
              <ChevronDown aria-hidden />
            </Button>
          </div>
        }
      />
    </section>
  );
}
