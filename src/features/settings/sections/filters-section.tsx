"use client";

import { Search } from "lucide-react";

import { NodeDot } from "@/components/node-dot";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFilterStore } from "@/features/filters/filter-store";
import { EdgeSample } from "@/features/legend/edge-sample";
import { EDGE_KINDS, edgeDefinition, LEVEL_LABELS, LEVELS, type Level } from "@/lib/content/relations";
import type { GraphDomain } from "@/lib/content/schema";

import { SettingsSection, SwitchRow } from "../setting-rows";

function Subheading({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 pb-1 text-ui-small font-normal text-faint">{children}</p>;
}

/** Which notes and edges the map shows. Every toggle here is the same filter the legend uses. */
export function FiltersSection({ domains }: { domains: GraphDomain[] }) {
  const filters = useFilterStore();
  const shownLevels = LEVELS.filter((level) => !filters.hiddenLevels.includes(level));

  return (
    <SettingsSection title="Filters" defaultOpen>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
        <Input
          type="search"
          aria-label="Filter notes"
          placeholder="Filter: words, tag:, level:, is:stub"
          value={filters.query}
          onChange={(event) => filters.set({ query: event.target.value })}
          className="h-8 pl-8 text-ui-small"
        />
      </div>
      <div className="pt-1">
        <SwitchRow label="Unwritten notes" checked={filters.ghosts} onChange={(ghosts) => filters.set({ ghosts })} sample={<NodeDot color="domain-1" tint={0} ghost />} />
        <SwitchRow label="Orphans" checked={filters.orphans} onChange={(orphans) => filters.set({ orphans })} />
        <SwitchRow label="Tags as nodes" checked={filters.tags} onChange={(tags) => filters.set({ tags })} />
      </div>
      <Subheading>Level</Subheading>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={shownLevels}
        onValueChange={(values) => filters.set({ hiddenLevels: LEVELS.filter((level) => !values.includes(level)) as Level[] })}
        className="w-full"
      >
        {LEVELS.map((level) => (
          <ToggleGroupItem key={level} value={level} className="flex-1 px-1.5">
            {LEVEL_LABELS[level]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Subheading>Relations</Subheading>
      {EDGE_KINDS.map((kind) => (
        <SwitchRow key={kind} label={edgeDefinition(kind).label} checked={filters.edges[kind]} onChange={() => filters.toggleEdge(kind)} sample={<EdgeSample kind={kind} className="text-muted-foreground" />} />
      ))}
      {domains.length === 1 && domains[0].clusters.length > 0 && (
        <>
          <Subheading>Clusters</Subheading>
          {domains[0].clusters.map((cluster, index) => {
            const key = `${domains[0].id}/${cluster.id}`;
            return (
              <SwitchRow
                key={key}
                label={cluster.name}
                checked={!filters.hiddenClusters.includes(key)}
                onChange={() => filters.toggleCluster(key)}
                sample={<NodeDot color={domains[0].color} tint={index} />}
              />
            );
          })}
        </>
      )}
    </SettingsSection>
  );
}
