"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import type { MapController } from "./map-controller";
import { createMinimap } from "./minimap-renderer";

/** Mounts the minimap's two canvases (notes, then the viewport rectangle on top, which takes input). Pointer-only; keyboard users have the map's own keys. */
export function Minimap({ controller, className }: { controller: MapController; className?: string }) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const base = baseRef.current;
    const overlay = overlayRef.current;
    if (!base || !overlay) return;
    return createMinimap({ base, overlay }, controller);
  }, [controller]);

  return (
    <div aria-hidden className={cn("relative overflow-hidden", className)}>
      <canvas ref={baseRef} className="absolute inset-0 block size-full" />
      <canvas ref={overlayRef} className="absolute inset-0 block size-full cursor-pointer touch-none" />
    </div>
  );
}
