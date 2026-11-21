"use client";

import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PANEL_WIDTH, SURFACE_INSET } from "./panel-size";
import { usePanelStore } from "./panel-store";

const KEY_STEP = 16;

/** Drag the panel's left edge (or use arrow keys) to resize it between panel-width-min and -max. */
function ResizeHandle() {
  const width = usePanelStore((state) => state.width);
  const setWidth = usePanelStore((state) => state.setWidth);
  const save = usePanelStore((state) => state.save);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) setWidth(window.innerWidth - SURFACE_INSET - event.clientX);
  };
  const onPointerUp = () => {
    setDragging(false);
    save();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = { ArrowLeft: width + KEY_STEP, ArrowRight: width - KEY_STEP, Home: PANEL_WIDTH.min, End: PANEL_WIDTH.max }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setWidth(next);
    save();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize note panel"
      aria-valuemin={PANEL_WIDTH.min}
      aria-valuemax={PANEL_WIDTH.max}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="group absolute inset-y-0 left-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center rounded-l-surface outline-none"
    >
      <span
        className={cn(
          "h-8 w-1 rounded-full bg-border-strong opacity-0 transition-opacity duration-instant ease-standard group-hover:opacity-100 group-focus-visible:bg-signal group-focus-visible:opacity-100",
          dragging && "opacity-100",
        )}
      />
    </div>
  );
}

type Props = { open: boolean; resizable: boolean; contentKey: string | null; children: ReactNode };

/**
 * The note panel on desktop and tablet: a floating surface over the canvas (it never resizes it),
 * between the top bar and the bottom inset. Before hydration on a phone, CSS shapes it as a 40% sheet.
 */
export function PanelFrame({ open, resizable, contentKey, children }: Props) {
  const width = usePanelStore((state) => state.width);

  return (
    <aside
      aria-label="Note"
      data-state={open ? "open" : "closed"}
      inert={!open}
      style={{ "--panel-current": `${width}px` } as CSSProperties}
      className={cn(
        "floating fixed top-[calc(var(--spacing-topbar)+--spacing(6))] right-3 bottom-3 z-panel flex w-(--panel-current) flex-col overflow-hidden",
        "max-lg:w-panel-tablet max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[40dvh] max-sm:w-auto max-sm:rounded-b-none",
        "transition-[translate,visibility] duration-base ease-standard",
        "data-[state=closed]:invisible data-[state=closed]:translate-x-[calc(100%+--spacing(3))] data-[state=closed]:duration-[calc(var(--dur-base)*0.7)] data-[state=closed]:ease-exit",
      )}
    >
      {resizable && <ResizeHandle />}
      <div key={contentKey ?? "closed"} className="min-h-0 flex-1 scroll-quiet overflow-y-auto overscroll-contain">
        {children}
      </div>
    </aside>
  );
}
