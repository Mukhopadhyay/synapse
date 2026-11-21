"use client";

import { NodeDot } from "@/components/node-dot";
import { LINE_DASHES, type LineStyle } from "@/lib/content/relations";
import { noteHref } from "@/lib/content/note-url";
import type { NoteRef, RelationGroup } from "@/lib/graph/note-view";
import { cn } from "@/lib/utils";

import { useNoteLink } from "./use-note-link";

/** The relation's line style, as drawn on the map and in the legend. */
function LineSample({ line }: { line: LineStyle }) {
  return (
    <svg aria-hidden width="16" height="2" className="shrink-0 text-muted-foreground">
      <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray={LINE_DASHES[line].join(" ")} />
    </svg>
  );
}

function RelationRow({ note }: { note: NoteRef }) {
  const handlers = useNoteLink(note.id);
  return (
    <li>
      <a
        href={noteHref(note.domain, note.id)}
        {...handlers}
        className="flex min-h-touch items-center gap-3 rounded-control px-3 py-1.5 transition-colors duration-instant ease-standard hover:bg-surface-raised sm:min-h-9"
      >
        <NodeDot color={note.color} tint={note.tint} ghost={note.ghost} />
        <span className={cn("line-clamp-2 min-w-0 flex-1 text-ui", note.ghost ? "text-muted-foreground" : "text-foreground")}>
          {note.title}
        </span>
        {note.ghost ? (
          <span className="shrink-0 text-ui-small text-faint">Not written yet</span>
        ) : (
          note.clusterName && <span className="shrink-0 text-ui-small text-faint">{note.clusterName}</span>
        )}
      </a>
    </li>
  );
}

/** Relations grouped by type in both directions; every row previews its node on hover and opens it on click. */
export function RelationList({ title, groups }: { title: string; groups: RelationGroup[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-note-heading text-foreground">{title}</h2>
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <h3 className="flex items-center gap-2 px-3 text-overline text-faint uppercase">
            {group.label}
            <LineSample line={group.line} />
          </h3>
          <ul className="flex flex-col">
            {group.notes.map((note) => (
              <RelationRow key={note.id} note={note} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
