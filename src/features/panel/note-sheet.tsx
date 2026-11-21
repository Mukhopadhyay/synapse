"use client";

import { useState, type ReactNode } from "react";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { TouchZoomStack } from "@/features/map/mobile-controls";

import { SHEET_SNAP } from "./panel-size";

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

const SNAP_POINTS = [SHEET_SNAP.peek, SHEET_SNAP.full];

/**
 * The note on mobile: a bottom sheet with a 40% peek and a 92% full snap. Non-modal (no scrim,
 * no focus trap), so the map stays usable above the peek. Vaul measures snaps against a full-height
 * drawer, so the content is 100dvh and pads its bottom by the 8% the full snap leaves above it.
 * The map's zoom stack rides 12px above the sheet's top edge at the peek, so it follows drags
 * without measuring them, and goes away at the full snap.
 * The only place Vaul is used for notes; swap it here.
 */
export function NoteSheet({ open, title, onClose, children }: Props) {
  const [snap, setSnap] = useState<number | string | null>(SHEET_SNAP.peek);
  const [shownTitle, setShownTitle] = useState(title);
  if (title !== shownTitle) {
    setShownTitle(title);
    setSnap(SHEET_SNAP.peek);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && onClose()}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      snapToSequentialPoint
      modal={false}
      noBodyStyles
    >
      <DrawerContent
        aria-describedby={undefined}
        className="h-dvh"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {snap === SHEET_SNAP.peek && <TouchZoomStack className="absolute right-3 bottom-full mb-3" />}
        <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto overscroll-contain pb-[8dvh]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
