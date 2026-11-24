import { ARROW_SIZE, edgeDefinition, LINE_DASHES, type EdgeKind } from "@/lib/content/relations";
import { cn } from "@/lib/utils";

const MID = 4;

/**
 * A short line drawn in an edge kind's real style (width, dash pattern and arrowhead from relations.ts),
 * pointing right like an edge from A to B. `length` is in px at 1:1, so dashes never stretch.
 */
export function EdgeSample({ kind, length = 24, className }: { kind: EdgeKind; length?: number; className?: string }) {
  const { width, line, arrow } = edgeDefinition(kind);
  const dashes = LINE_DASHES[line];
  const scale = Math.max(1, width);
  const head = arrow === "none" ? 0 : scale * ARROW_SIZE.length;
  const half = (scale * ARROW_SIZE.width) / 2;
  const tip = arrow === "hollow" ? length - 0.5 : length;
  const base = tip - head;
  return (
    <svg aria-hidden viewBox={`0 0 ${length} 8`} className={cn("h-2 w-6 shrink-0", className)}>
      <line x1="0" y1={MID} x2={base} y2={MID} stroke="currentColor" strokeWidth={width} strokeDasharray={dashes.length ? dashes.join(" ") : undefined} />
      {arrow !== "none" && (
        <polygon
          points={`${tip},${MID} ${base},${MID - half} ${base},${MID + half}`}
          fill={arrow === "filled" ? "currentColor" : "none"}
          stroke={arrow === "hollow" ? "currentColor" : "none"}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
