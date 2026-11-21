"use client";

import type { FocusEvent, MouseEvent } from "react";

import { useMapStore } from "@/lib/store/map-store";

import { openNote } from "./use-note-link";

const wikilinkAt = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLAnchorElement>("a[data-slug]") : null;

/**
 * The note body, rendered to HTML at build time. Wikilinks behave like relation rows:
 * hover or focus previews the node on the map, click opens it. Handled by delegation.
 */
export function NoteBody({ html }: { html: string }) {
  const { setHovered } = useMapStore.getState();

  const preview = (event: MouseEvent | FocusEvent) => {
    const slug = wikilinkAt(event.target)?.dataset.slug;
    if (slug) setHovered(slug, "panel");
  };
  const clear = (event: MouseEvent | FocusEvent) => {
    const link = wikilinkAt(event.target);
    if (link && !link.contains(event.relatedTarget as Node | null)) setHovered(null);
  };
  const onClick = (event: MouseEvent) => {
    const slug = wikilinkAt(event.target)?.dataset.slug;
    if (slug) openNote(event, slug);
  };

  return (
    <div
      className="note-prose"
      onClick={onClick}
      onMouseOver={preview}
      onMouseOut={clear}
      onFocus={preview}
      onBlur={clear}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Static placeholder sized like a few paragraphs; no shimmer. */
export function BodySkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="h-4 w-full rounded-chip bg-surface-raised" />
      <div className="h-4 w-11/12 rounded-chip bg-surface-raised" />
      <div className="h-4 w-full rounded-chip bg-surface-raised" />
      <div className="h-4 w-3/5 rounded-chip bg-surface-raised" />
    </div>
  );
}
