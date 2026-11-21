"use client";

import { usePathname } from "next/navigation";

import { NotePanel } from "@/features/panel/note-panel";
import { isDocumentPath } from "@/lib/content/note-url";

/**
 * Where a route's server-rendered content goes: note pages into the note panel, document pages
 * (Contribute) into a scrolling layer above the hidden map.
 */
export function RouteContent({ children }: { children: React.ReactNode }) {
  const isDocument = isDocumentPath(usePathname());
  return (
    <>
      {isDocument && <div className="scroll-quiet absolute inset-0 z-canvas overflow-y-auto px-4 [scrollbar-gutter:stable_both-edges] sm:px-6">{children}</div>}
      <NotePanel>{isDocument ? null : children}</NotePanel>
    </>
  );
}
