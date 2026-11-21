import { cn } from "@/lib/utils";

/** One legend entry that shows or hides its kind of thing on the map. Off rows fade and say "Off". */
export function LegendRow({ on, onToggle, sample, label }: { on: boolean; onToggle: () => void; sample: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-chip px-1 text-left text-ui-small font-normal transition-colors duration-instant hover:bg-surface-raised",
        on ? "text-muted-foreground hover:text-foreground" : "text-faint",
      )}
    >
      <span className={cn("flex shrink-0 items-center", !on && "opacity-50")}>{sample}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!on && <span className="text-faint">Off</span>}
    </button>
  );
}
