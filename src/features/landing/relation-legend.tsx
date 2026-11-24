import { NodeDot } from "@/components/node-dot";
import { EdgeSample } from "@/features/legend/edge-sample";
import { directionHint, EDGE_KINDS, edgeDefinition, type EdgeKind } from "@/lib/content/relations";

/** One line per edge kind; typed against EdgeKind so a new relation can't ship without its sentence. */
const MEANINGS: Record<EdgeKind, string> = {
  requires: "Read that one first.",
  extends: "Builds directly on it.",
  related: "Often read together.",
  contrasts: "Easy to mix up; the note says how they differ.",
  mentions: "Linked from inside the text.",
};

function LegendItem({ sample, label, meaning }: { sample: React.ReactNode; label: string; meaning: string }) {
  return (
    <li className="flex items-start gap-4 border-b border-border py-4.5">
      <span className="flex h-4.5 w-10 shrink-0 items-center justify-center text-muted-foreground">{sample}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-ui-small text-foreground">{label}</span>
        <span className="text-ui-small font-normal text-muted-foreground">{meaning}</span>
      </span>
    </li>
  );
}

/** Section 02's key: every relation drawn in its real line style and arrowhead from relations.ts, then unwritten notes. */
export function RelationLegend() {
  return (
    <>
      <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
        {EDGE_KINDS.map((kind) => (
          <LegendItem key={kind} sample={<EdgeSample kind={kind} length={40} className="w-10" />} label={edgeDefinition(kind).label} meaning={MEANINGS[kind]} />
        ))}
        <LegendItem sample={<NodeDot color="domain-1" tint={0} ghost className="size-2.5" />} label="Not written yet" meaning="Other notes point here. Nobody has written it." />
      </ul>
      <p className="mt-4 text-ui-small font-normal text-muted-foreground">{directionHint()}</p>
    </>
  );
}
