"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { isDocumentPath, parseGraphPath } from "@/lib/content/note-url";
import { useMapStore } from "@/lib/store/map-store";
import { cn } from "@/lib/utils";

/** The canvas layer. It stays mounted under the list view and document pages (hidden), so the camera and layout survive switching views. */
export function MapLayer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const list = parseGraphPath(pathname)?.view === "list" || isDocumentPath(pathname);
  useEffect(() => useMapStore.getState().setMapHidden(list), [list]);
  return (
    <main aria-hidden={list || undefined} className={cn("absolute inset-0 z-canvas", list && "invisible")}>
      {children}
    </main>
  );
}
