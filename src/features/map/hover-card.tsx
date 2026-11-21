"use client";

import { useEffect, useState } from "react";

import { Chip } from "@/components/ui/chip";
import { LEVEL_LABELS } from "@/lib/content/relations";
import { useMapStore } from "@/lib/store/map-store";

import type { MapController } from "./map-controller";

const OPEN_DELAY = 300;
const CLOSE_DELAY = 100;
const CARD_WIDTH = 280;
const OFFSET = 12;

type Shown = { id: string; left: number; top: number; above: boolean };

/**
 * Preview of the node under the pointer: breadcrumb, title, summary, level and relation count.
 * Hidden for the selected node (its panel is open), while dragging, and for previews from the panel.
 */
export function HoverCard({ controller }: { controller: MapController }) {
  const hoveredId = useMapStore((state) =>
    state.hoverSource === "map" && !state.draggingId && state.hoveredId !== state.selectedId ? state.hoveredId : null,
  );
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        const position = hoveredId ? controller.viewportPosition(hoveredId) : null;
        if (!hoveredId || !position) {
          setShown(null);
          return;
        }
        const fitsRight = position.x + position.radius + OFFSET + CARD_WIDTH < window.innerWidth - OFFSET;
        const left = fitsRight ? position.x + position.radius + OFFSET : position.x - position.radius - OFFSET - CARD_WIDTH;
        const above = position.y > window.innerHeight * 0.6;
        setShown({
          id: hoveredId,
          left: Math.max(OFFSET, left),
          top: above ? position.y - position.radius - OFFSET : position.y + position.radius + OFFSET,
          above,
        });
      },
      hoveredId ? OPEN_DELAY : CLOSE_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [hoveredId, controller]);

  const node = shown ? controller.node(shown.id) : undefined;
  if (!shown || !node) return null;

  return (
    <div
      aria-hidden
      className="floating pointer-events-none absolute top-0 left-0 z-popover flex w-hover-card flex-col gap-2 p-4 animate-in fade-in-0 duration-quick ease-standard [@media(hover:none)]:hidden"
      style={{ transform: `translate(${shown.left}px, ${shown.top}px)${shown.above ? " translateY(-100%)" : ""}` }}
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
