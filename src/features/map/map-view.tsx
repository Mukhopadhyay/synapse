"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { FilterQuerySync } from "@/features/filters/filter-query-sync";
import { useHotkey } from "@/features/keyboard/use-hotkey";
import { Legend } from "@/features/legend/legend";
import { useMapDomains } from "@/features/navigation/use-map-domains";
import { GroupSync } from "@/features/settings/group-sync";
import { isAllFieldsPath } from "@/lib/content/note-url";
import type { GraphData, GraphDomain } from "@/lib/content/schema";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";
import { cn } from "@/lib/utils";

import { CanvasControls } from "./canvas-controls";
import { CanvasMap } from "./canvas-map";
import { HoverCard } from "./hover-card";
import { createMapController } from "./map-controller";
import { MapHint } from "./map-hint";
import { LoadFailure, LoadingNotice } from "./map-status";
import { NodeContextMenu } from "./node-context-menu";
import { NotesList } from "./notes-list";
import { SelectionAnnouncer } from "./selection-announcer";
import { useMapKeyboard } from "./use-map-keyboard";
import { useMapShortcuts } from "./use-map-shortcuts";

/** Esc peels one layer: the hover preview first, then keyboard focus, then the open note. */
function useEscape() {
  useHotkey("escape", () => {
    const { hoveredId, focusedId, setHovered, setFocused, close } = useMapStore.getState();
    if (hoveredId) setHovered(null);
    else if (focusedId) setFocused(null);
    else close();
  });
}

function GraphMap({ data, domains }: { data: GraphData; domains: GraphDomain[] }) {
  const controller = useMemo(() => createMapController(data, domains.map((domain) => domain.id)), [data, domains]);
  const mapRef = useRef<HTMLDivElement>(null);
  const keyboard = useMapKeyboard(controller, mapRef);
  const cursor = useMapStore((state) =>
    state.draggingId ? "cursor-grabbing" : state.hoveredId !== null && state.hoverSource === "map" ? "cursor-pointer" : null,
  );
  const allFields = isAllFieldsPath(usePathname());
  useEscape();
  useMapShortcuts(controller);
  useEffect(() => {
    const { setCommands } = useMapStore.getState();
    setCommands({ zoomIn: () => controller.zoomIn(), zoomOut: () => controller.zoomOut(), fit: controller.fit });
    return () => setCommands(null);
  }, [controller]);
  useEffect(() => {
    controller.model.setFieldLabels(allFields);
    const { interacted, selectedId } = useMapStore.getState();
    if (!interacted && !selectedId) controller.fit();
  }, [controller, allFields]);

  return (
    <>
      <NodeContextMenu controller={controller}>
        <div
          ref={mapRef}
          role="application"
          aria-label="Concept map. Tab moves between notes, Enter opens one, arrow keys pan, plus and minus zoom."
          className={cn("absolute inset-0 outline-none", cursor)}
          {...keyboard}
        >
          <CanvasMap controller={controller} />
        </div>
      </NodeContextMenu>
      <HoverCard controller={controller} />
      <CanvasControls controller={controller} domains={domains} />
      <Legend domains={domains} />
      <MapHint />
      <FilterQuerySync data={data} />
      <GroupSync data={data} />
      <SelectionAnnouncer controller={controller} />
      <NotesList controller={controller} />
    </>
  );
}

/** Loads graph.json and renders the active domain's map. Client-only: imported with ssr: false. */
export default function MapView() {
  const status = useGraphStore((state) => state.status);
  const data = useGraphStore((state) => state.data);
  const load = useGraphStore((state) => state.load);
  const domains = useMapDomains(data);
  useEffect(load, [load]);

  if (status === "error") return <LoadFailure onRetry={load} />;
  if (status !== "ready" || !data || domains.length === 0) return <LoadingNotice />;
  return <GraphMap key={domains.map((domain) => domain.id).join()} data={data} domains={domains} />;
}
