"use client";

import { useEffect, useRef } from "react";

import { createCanvasRenderer } from "./canvas-renderer";
import type { MapController } from "./map-controller";

/** Mounts the map's three stacked canvases (backdrop, effects, graph) and hands them to the controller. Only the top one takes input. */
export function CanvasMap({ controller }: { controller: MapController }) {
  const backdropRef = useRef<HTMLCanvasElement>(null);
  const effectsRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const effects = effectsRef.current;
    const main = mainRef.current;
    if (!backdrop || !effects || !main) return;
    return controller.use(createCanvasRenderer({ backdrop, effects, main }, controller.model));
  }, [controller]);

  return (
    <div className="relative size-full">
      <canvas ref={backdropRef} aria-hidden className="pointer-events-none absolute inset-0 block size-full" />
      <canvas ref={effectsRef} aria-hidden className="pointer-events-none absolute inset-0 block size-full" />
      <canvas ref={mainRef} className="absolute inset-0 block size-full touch-none" />
    </div>
  );
}
