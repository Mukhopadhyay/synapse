import { NodeDot } from "@/components/node-dot";
import { Chip } from "@/components/ui/chip";
import { contributeUrl } from "@/lib/content/contribute-url";
import { listHref } from "@/lib/content/note-url";
import type { GraphData } from "@/lib/content/schema";
import { breadcrumb, noteRef } from "@/lib/graph/note-view";

import { ArrowLink, ContributeSection } from "./section";

const LIMIT = 6;

/** Ghosts and stubs the map already links to most, each with a direct "Write →" or "Finish →" on GitHub. */
export function WaitingList({ data }: { data: GraphData }) {
  const waiting = data.nodes
    .filter((node) => node.ghost || node.stub)
    .sort((a, b) => b.relationCount - a.relationCount || Number(b.ghost) - Number(a.ghost) || a.title.localeCompare(b.title))
    .slice(0, LIMIT);
  const domain = data.domains[0]?.id;
  if (waiting.length === 0) return null;

  return (
    <ContributeSection
      title="Waiting for a writer"
      intro="Notes the map already links to, each one a few paragraphs from done."
      action={domain && <ArrowLink href={listHref(domain)}>See all in List view</ArrowLink>}
    >
      <ul className="mt-6 overflow-hidden rounded-surface border border-border bg-surface">
        {waiting.map((node) => {
          const ref = noteRef(data, node);
          return (
            <li key={node.id} className="flex h-12 items-center gap-3 border-b border-border px-4 last:border-b-0">
              <NodeDot color={ref.color} tint={ref.tint} ghost={node.ghost} />
              <span className="truncate text-ui text-foreground">{node.title}</span>
              <span className="truncate text-ui-small font-normal text-faint max-sm:hidden">{breadcrumb(data, node)}</span>
              <span className="ml-auto flex shrink-0 items-center gap-4">
                <Chip variant="outline">{node.ghost ? "Not written yet" : "Stub"}</Chip>
                <ArrowLink href={contributeUrl(node, data.template)} external>
                  {node.ghost ? "Write" : "Finish"}
                </ArrowLink>
              </span>
            </li>
          );
        })}
      </ul>
    </ContributeSection>
  );
}
