"use client";

import { noteHref } from "@/lib/content/note-url";
import { useProgressStore } from "@/features/progress/progress-store";
import { openNote } from "@/features/panel/use-note-link";

import type { MapController } from "./map-controller";

/**
 * Every note on the map as a plain list, for screen readers. Visually hidden and out of the Tab
 * order (the map itself is Tab-navigable), but reachable with a screen reader's reading cursor.
 */
export function NotesList({ controller }: { controller: MapController }) {
  const studied = useProgressStore((state) => state.studiedSet);
  return (
    <nav aria-label="All notes on this map" className="sr-only">
      <ul>
        {controller.keyboardOrder().map((id) => {
          const node = controller.node(id);
          if (!node) return null;
          return (
            <li key={id}>
              <a href={noteHref(node.domain, id)} tabIndex={-1} onClick={(event) => openNote(event, id)}>
                {node.title}, {controller.breadcrumb(id)}
                {node.ghost ? ", not written yet" : ""}
                {studied.has(id) ? ", studied" : ""}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
