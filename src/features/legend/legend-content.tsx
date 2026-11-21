"use client";

import { NodeDot } from "@/components/node-dot";
import { Separator } from "@/components/ui/separator";
import { useFilterStore } from "@/features/filters/filter-store";
import { EDGE_KINDS, edgeDefinition } from "@/lib/content/relations";
import type { GraphDomain } from "@/lib/content/schema";

import { EdgeSample } from "./edge-sample";
import { LegendRow } from "./legend-row";

export function LegendHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-overline text-faint uppercase">{children}</h2>;
}

/** Clusters of one field, or the fields themselves on the all-fields map. Rows come from `_domain.yml`. */
function GroupRows({ domains }: { domains: GraphDomain[] }) {
  const { hiddenClusters, hiddenDomains, toggleCluster, toggleDomain } = useFilterStore();
  if (domains.length === 1) {
    const [domain] = domains;
    return domain.clusters.map((cluster, index) => {
      const key = `${domain.id}/${cluster.id}`;
      return (
        <LegendRow
          key={key}
          on={!hiddenClusters.includes(key)}
          onToggle={() => toggleCluster(key)}
          sample={<NodeDot color={domain.color} tint={index} />}
          label={cluster.name}
        />
      );
    });
  }
  return domains.map((domain) => (
    <LegendRow
      key={domain.id}
      on={!hiddenDomains.includes(domain.id)}
      onToggle={() => toggleDomain(domain.id)}
      sample={<NodeDot color={domain.color} tint={0} />}
      label={domain.name}
    />
  ));
}

export function groupsHeading(domains: GraphDomain[]) {
  return domains.length === 1 ? `${domains[0].name} clusters` : "Fields";
}

/**
 * The legend's sections: clusters (or fields), relations drawn in their real line styles, and
 * unwritten notes. Every row is a toggle on the shared filter store, so the legend and the
 * settings panel never disagree. `header` replaces the first heading (the floating card puts its
 * collapse button there).
 */
export function LegendContent({ domains, header }: { domains: GraphDomain[]; header?: React.ReactNode }) {
  const { edges, ghosts, toggleEdge, set } = useFilterStore();

  return (
    <div className="flex flex-col">
      {header ?? <LegendHeading>{groupsHeading(domains)}</LegendHeading>}
      <div className="mt-2 flex flex-col">
        <GroupRows domains={domains} />
      </div>
      <Separator className="my-3" />
      <LegendHeading>Relations</LegendHeading>
      <div className="mt-2 flex flex-col">
        {EDGE_KINDS.map((kind) => (
          <LegendRow
            key={kind}
            on={edges[kind]}
            onToggle={() => toggleEdge(kind)}
            sample={<EdgeSample kind={kind} />}
            label={edgeDefinition(kind).label}
          />
        ))}
      </div>
      <Separator className="mt-2.5 mb-1.5" />
      <LegendRow on={ghosts} onToggle={() => set({ ghosts: !ghosts })} sample={<NodeDot color="domain-1" tint={0} ghost className="size-2.5" />} label="Not written yet" />
    </div>
  );
}
