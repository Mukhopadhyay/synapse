import type { DomainColor } from "@/lib/content/relations";
import { cn } from "@/lib/utils";

type Props = { color: DomainColor; tint: number; ghost?: boolean; className?: string };

/** A note's map colour as an 8px dot (hollow ring for ghosts). Tints are computed in CSS, mirroring the map palette. */
export function NodeDot({ color, tint, ghost = false, className }: Props) {
  return (
    <span
      aria-hidden
      data-node-dot={ghost ? "ghost" : ""}
      data-domain={color}
      data-tint={tint >= 0 ? tint % 5 : 0}
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
    />
  );
}
