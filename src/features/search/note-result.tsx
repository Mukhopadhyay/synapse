import { NodeDot } from "@/components/node-dot";
import { Chip } from "@/components/ui/chip";
import { CommandItem } from "@/components/ui/command";
import type { GraphData, GraphNode } from "@/lib/content/schema";
import { breadcrumb, noteRef } from "@/lib/graph/note-view";

import { Highlight } from "./highlight";

export const noteValue = (id: string) => `note:${id}`;

/** A note in the palette: dot, title with the matched part in bold, "Not written yet" for ghosts, breadcrumb on the right. */
export function NoteResult({ data, node, query, onSelect }: { data: GraphData; node: GraphNode; query: string; onSelect: (id: string) => void }) {
  const ref = noteRef(data, node);
  return (
    <CommandItem value={noteValue(node.id)} onSelect={() => onSelect(node.id)} className="h-11 py-0">
      <NodeDot color={ref.color} tint={ref.tint} ghost={node.ghost} />
      <span className="truncate font-normal text-foreground">
        <Highlight text={node.title} query={query} />
      </span>
      {node.ghost && <Chip variant="outline">Not written yet</Chip>}
      <span className="ml-auto shrink-0 pl-3 text-ui-small font-normal text-faint">{breadcrumb(data, node)}</span>
    </CommandItem>
  );
}
