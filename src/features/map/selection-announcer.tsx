"use client";

import { useMapStore } from "@/lib/store/map-store";

import type { MapController } from "./map-controller";

/**
 * Announces the focused or selected note to screen readers:
 * "Attention, AI › Attention, 4 relations. Press Enter to open."
 */
export function SelectionAnnouncer({ controller }: { controller: MapController }) {
  const focusedId = useMapStore((state) => state.focusedId);
  const selectedId = useMapStore((state) => state.selectedId);
  const id = focusedId ?? selectedId;
  const node = id ? controller.node(id) : undefined;
  const relations = node ? `${node.relationCount} ${node.relationCount === 1 ? "relation" : "relations"}` : "";
  const status = node?.ghost ? ", not written yet" : "";
  const hint = focusedId && focusedId !== selectedId ? ". Press Enter to open." : "";
  const message = node ? `${node.title}, ${controller.breadcrumb(node.id)}${status}, ${relations}${hint}` : "";

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
