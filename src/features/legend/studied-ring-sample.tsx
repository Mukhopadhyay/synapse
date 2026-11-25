import { cn } from "@/lib/utils";

/** A dot inside the green ring that marks a studied note, for the legend and the landing page's key. */
export function StudiedRingSample({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-success", className)}>
      <span className="size-1.5 rounded-full bg-muted-foreground" />
    </span>
  );
}
