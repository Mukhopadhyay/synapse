"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { slugFromPath } from "@/lib/content/note-url";
import { noteView } from "@/lib/graph/note-view";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";

import { BodySkeleton } from "./note-body";
import { NoteSheet } from "./note-sheet";
import { NoteView } from "./note-view";
import { PanelFrame } from "./panel-frame";
import { PANEL_WIDTH, SHEET_SNAP, SURFACE_INSET } from "./panel-size";
import { usePanelStore } from "./panel-store";

/** Title, summary and relations straight from graph.json while the note's page loads. */
function InstantNote({ id }: { id: string }) {
  const data = useGraphStore((state) => state.data);
  const view = useMemo(() => (data ? noteView(data, id) : null), [data, id]);
  if (!view) {
    return (
      <div className="p-4 sm:p-6">
        <BodySkeleton />
      </div>
    );
  }
  return <NoteView view={view} body={null} />;
}

/** Tells the map how much of the screen the open panel covers, so the selected node centres in what's left. */
function usePublishInsets(breakpoint: ReturnType<typeof useBreakpoint>) {
  const width = usePanelStore((state) => state.width);
  const setInsets = useMapStore((state) => state.setInsets);
  useEffect(() => {
    const right = { desktop: width, tablet: PANEL_WIDTH.tablet, mobile: -SURFACE_INSET }[breakpoint] + SURFACE_INSET;
    const bottom = breakpoint === "mobile" ? Math.round(window.innerHeight * SHEET_SNAP.peek) : 0;
    setInsets({ right, bottom });
  }, [breakpoint, width, setInsets]);
}

/**
 * The note panel, in the shell so it survives navigation. `children` is the route: the static
 * note page (header, relations, body) or nothing on a bare graph. A note selected on the map opens at
 * once from graph.json and switches to its page when the route arrives; while closing, the last
 * page stays inside the panel until it has slid away.
 */
export function NotePanel({ children }: { children: ReactNode }) {
  const breakpoint = useBreakpoint();
  const urlSlug = slugFromPath(usePathname());
  const synced = useMapStore((state) => state.synced);
  const selectedId = useMapStore((state) => state.selectedId);
  const close = useMapStore((state) => state.close);
  const title = useGraphStore((state) => state.data?.nodes.find((node) => node.id === selectedId)?.title);
  const restoreWidth = usePanelStore((state) => state.restore);
  useEffect(restoreWidth, [restoreWidth]);
  usePublishInsets(breakpoint);

  const current = synced ? selectedId : urlSlug;
  const showPage = current !== null && current === urlSlug;
  const [held, setHeld] = useState<{ key: string | null; page: ReactNode }>({ key: urlSlug, page: children });
  if (showPage && (children !== held.page || current !== held.key)) setHeld({ key: current, page: children });
  const content = showPage ? children : current ? <InstantNote id={current} /> : held.page;

  if (breakpoint === "mobile") {
    return (
      <NoteSheet open={current !== null} title={title ?? "Note"} onClose={close}>
        {content}
      </NoteSheet>
    );
  }
  return (
    <PanelFrame open={current !== null} resizable={breakpoint === "desktop"} contentKey={current ?? held.key}>
      {content}
    </PanelFrame>
  );
}
