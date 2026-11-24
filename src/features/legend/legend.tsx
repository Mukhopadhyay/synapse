"use client";

import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMapOverlay } from "@/features/map/use-map-overlay";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import type { GraphDomain } from "@/lib/content/schema";
import { useMapStore } from "@/lib/store/map-store";
import { usePrefsStore } from "@/lib/store/prefs-store";

import { groupsHeading, LegendContent, LegendHeading } from "./legend-content";

/**
 * Bottom-left on tablet and desktop: a "Legend" button that opens into a card of toggles.
 * Collapsed by default; on desktop the choice is remembered. It starts collapsed on tablets and
 * while the welcome card is up, until the person opens it. Phones get the same content in the
 * menu sheet. Either form reports itself as a map overlay.
 */
export function Legend({ domains }: { domains: GraphDomain[] }) {
  const remembered = usePrefsStore((state) => state.legendOpen);
  const setPrefs = usePrefsStore((state) => state.set);
  const tablet = useBreakpoint() === "tablet";
  const welcomeOpen = useMapStore((state) => "welcome" in state.overlays);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? (remembered && !tablet && !welcomeOpen);
  const overlayRef = useMapOverlay("legend");

  const choose = (next: boolean) => {
    setChosen(next);
    setPrefs({ legendOpen: next });
  };

  if (!open) {
    return (
      <Button
        ref={overlayRef}
        variant="ghost"
        className="floating absolute bottom-3 left-3 z-overlay h-8 gap-2 px-3 text-ui text-foreground max-sm:hidden"
        aria-expanded={false}
        onClick={() => choose(true)}
      >
        <Layers aria-hidden />
        Legend
      </Button>
    );
  }

  return (
    <section ref={overlayRef} aria-label="Legend" className="floating absolute bottom-3 left-3 z-overlay w-58 p-3 pb-2 max-sm:hidden">
      <LegendContent
        domains={domains}
        header={
          <div className="flex h-6 items-center justify-between">
            <LegendHeading>{groupsHeading(domains)}</LegendHeading>
            <Button variant="ghost" size="icon" className="size-6" aria-label="Collapse legend" aria-expanded onClick={() => choose(false)}>
              <ChevronDown aria-hidden />
            </Button>
          </div>
        }
      />
    </section>
  );
}
