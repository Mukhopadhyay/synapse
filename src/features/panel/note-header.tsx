"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { NodeDot } from "@/components/node-dot";
import { StudiedDate, StudiedToggle } from "@/features/progress/studied-toggle";
import { LEVEL_LABELS } from "@/lib/content/relations";
import type { NoteView } from "@/lib/graph/note-view";
import { useMapStore } from "@/lib/store/map-store";
import { cn } from "@/lib/utils";

/** Breadcrumb, close, Newsreader title, summary, then level, relation count, status and tags. */
export function NoteHeader({ view }: { view: NoteView }) {
  const { node, ref, breadcrumb } = view;
  const close = useMapStore((state) => state.close);

  return (
    <header className="flex flex-col gap-3">
      <div className="-mr-2 flex items-center justify-between gap-2">
        <p className="text-overline text-faint uppercase">{breadcrumb}</p>
        <Button variant="ghost" size="icon" aria-label="Close note" onClick={close}>
          <X aria-hidden />
        </Button>
      </div>
      <h1
        className={cn(
          "font-serif text-note-title-mobile text-balance sm:text-note-title",
          node.ghost ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {node.title}
      </h1>
      {node.summary && <p className="text-note-summary text-muted-foreground">{node.summary}</p>}
      <div className="flex flex-wrap gap-2">
        {node.ghost ? (
          <>
            <Chip variant="outline">
              <NodeDot color={ref.color} tint={ref.tint} ghost />
              Not written yet
            </Chip>
            <Chip variant="outline" className="font-mono">
              {node.id}
            </Chip>
          </>
        ) : (
          <>
            <StudiedToggle slug={node.id} />
            {node.level && <Chip>{LEVEL_LABELS[node.level]}</Chip>}
            <Chip>
              {node.relationCount} {node.relationCount === 1 ? "relation" : "relations"}
            </Chip>
            {node.stub && <Chip variant="outline">Stub</Chip>}
            {node.tags.map((tag) => (
              <Chip key={tag} variant="outline">
                {tag}
              </Chip>
            ))}
          </>
        )}
      </div>
      {!node.ghost && <StudiedDate slug={node.id} />}
    </header>
  );
}
