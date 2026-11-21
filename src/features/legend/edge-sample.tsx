import { edgeDefinition, LINE_DASHES, type EdgeKind } from "@/lib/content/relations";
import { cn } from "@/lib/utils";

/** A short line drawn in an edge kind's real style (width and dash pattern from relations.ts). `length` is in px at 1:1, so dashes never stretch. */
export function EdgeSample({ kind, length = 24, className }: { kind: EdgeKind; length?: number; className?: string }) {
  const { width, line } = edgeDefinition(kind);
  const dashes = LINE_DASHES[line];
  return (
    <svg aria-hidden viewBox={`0 0 ${length} 8`} className={cn("h-2 w-6 shrink-0", className)}>
      <line x1="0" y1="4" x2={length} y2="4" stroke="currentColor" strokeWidth={width} strokeDasharray={dashes.length ? dashes.join(" ") : undefined} />
    </svg>
  );
}
