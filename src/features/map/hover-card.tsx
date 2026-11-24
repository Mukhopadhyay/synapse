"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Chip } from "@/components/ui/chip";
import { LEVEL_LABELS } from "@/lib/content/relations";
import { useMapStore } from "@/lib/store/map-store";
import { cn } from "@/lib/utils";

import { placeHoverCard, type HoverPlacement, type Neighbour } from "./hover-placement";
import type { MapController } from "./map-controller";

const OPEN_DELAY = 300;
const CLOSE_DELAY = 100;
const OFFSET = 12;
/** The top bar's bottom edge plus a gap: the card stays below it. */
const MIN_TOP = 64;

type Anchor = { id: string; node: { x: number; y: number; radius: number }; neighbours: Neighbour[] };

/**
 * Preview of the node under the pointer: breadcrumb, title, summary, level and relation count.
 * It sits on whichever side of the node hides the fewest neighbours, measured before it paints.
 * Hidden for the selected node (its panel is open), while dragging, and for previews from the panel.
 */
export function HoverCard({ controller }: { controller: MapController }) {
  const hoveredId = useMapStore((state) =>
    state.hoverSource === "map" && !state.draggingId && state.hoveredId !== state.selectedId ? state.hoveredId : null,
  );
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [placed, setPlaced] = useState<(HoverPlacement & { id: string }) | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        const node = hoveredId ? controller.viewportPosition(hoveredId) : null;
        setAnchor(hoveredId && node ? { id: hoveredId, node, neighbours: controller.neighbourBoxes(hoveredId) } : null);
      },
      hoveredId ? OPEN_DELAY : CLOSE_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [hoveredId, controller]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!anchor || !card) return;
    const placement = placeHoverCard({
      node: anchor.node,
      card: { width: card.offsetWidth, height: card.offsetHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      neighbours: anchor.neighbours,
      gap: OFFSET,
      minTop: MIN_TOP,
    });
    // Measuring needs the card laid out first, so its position lands in a second render before paint.
    setPlaced({ id: anchor.id, ...placement });
  }, [anchor]);

  const node = anchor ? controller.node(anchor.id) : undefined;
  if (!anchor || !node) return null;
  const position = placed?.id === anchor.id ? placed : null;

  return (
    <div
      ref={cardRef}
      aria-hidden
      data-side={position?.side}
      className={cn(
        "floating pointer-events-none absolute top-0 left-0 z-popover flex w-hover-card flex-col gap-2 p-4 animate-in fade-in-0 duration-quick ease-standard [@media(hover:none)]:hidden",
        !position && "invisible",
      )}
      style={position ? { transform: `translate(${position.left}px, ${position.top}px)` } : undefined}
    >
      <p className="text-overline text-faint uppercase">{controller.breadcrumb(node.id)}</p>
      <p className="text-ui font-semibold text-foreground">{node.title}</p>
      {node.summary && <p className="line-clamp-3 text-ui-small font-normal text-muted-foreground">{node.summary}</p>}
      <div className="flex flex-wrap gap-2">
        {node.ghost ? (
          <Chip variant="outline">Not written yet</Chip>
        ) : (
          node.level && <Chip>{LEVEL_LABELS[node.level]}</Chip>
        )}
        <Chip>
          {node.relationCount} {node.relationCount === 1 ? "relation" : "relations"}
        </Chip>
      </div>
    </div>
  );
}
