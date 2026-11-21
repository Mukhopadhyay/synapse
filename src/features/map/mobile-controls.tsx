"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

import { useMapStore } from "@/lib/store/map-store";
import { usePrefsStore } from "@/lib/store/prefs-store";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import type { MapController } from "./map-controller";
import { Minimap } from "./minimap";

/** How long the phone minimap stays after the last pan or pinch. */
const MINIMAP_LINGER_MS = 1500;
const BOTTOM = "bottom-[calc(--spacing(3)+env(safe-area-inset-bottom))]";

/**
 * Zoom in, zoom out and fit as 44px touch buttons in a narrow floating stack. It reads the map's
 * commands from the store, so the phone sheet can carry it on its top edge.
 */
export function TouchZoomStack({ className, style }: { className?: string; style?: CSSProperties }) {
  const commands = useMapStore((state) => state.commands);
  if (!commands) return null;
  return (
    <div data-vaul-no-drag="" className={cn("floating flex flex-col p-0.5", className)} style={style}>
      <ControlButton label="Zoom in" icon={Plus} onClick={commands.zoomIn} className="size-touch" />
      <ControlButton label="Zoom out" icon={Minus} onClick={commands.zoomOut} className="size-touch" />
      <ControlButton label="Fit graph" icon={Maximize} onClick={commands.fit} className="size-touch" />
    </div>
  );
}

/** Bottom-left on phones: shows while a pan or pinch moves the camera and fades 1.5s after it stops. Tapping it jumps there. */
function PhoneMinimap({ controller }: { controller: MapController }) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const linger = () => {
      setActive(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), MINIMAP_LINGER_MS);
    };
    const stop = controller.onGestureMove(linger);
    return () => {
      stop();
      clearTimeout(timer.current);
    };
  }, [controller]);

  const keepAlive = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), MINIMAP_LINGER_MS);
  };

  return (
    <div
      onPointerDown={keepAlive}
      className={cn(
        "floating absolute left-3 z-overlay p-1 transition-opacity duration-quick ease-standard",
        BOTTOM,
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Minimap controller={controller} className="aspect-[8/5] w-38 rounded-control" />
    </div>
  );
}

/**
 * Phones: the touch zoom stack bottom-right (lifted above the welcome sheet; carried by the note
 * sheet while a note is open) and the minimap bottom-left while the camera is being moved.
 */
export function MobileControls({ controller }: { controller: MapController }) {
  const sheetOpen = useMapStore((state) => state.selectedId !== null);
  const bottomInset = useMapStore((state) => state.bottomInset);
  const minimap = usePrefsStore((state) => state.minimap);

  if (sheetOpen) return null;
  return (
    <>
      <TouchZoomStack
        className={cn("absolute right-3 z-overlay transition-transform duration-base ease-standard", BOTTOM)}
        style={bottomInset ? { transform: `translateY(${-bottomInset}px)` } : undefined}
      />
      {minimap && bottomInset === 0 && <PhoneMinimap controller={controller} />}
    </>
  );
}
