"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { useProgressStore } from "@/features/progress/progress-store";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { parseGraphPath } from "@/lib/content/note-url";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";

import { listRows, sortRows, type Sort, type SortKey, type StatusFilter } from "./list-rows";
import { ListTable } from "./list-table";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "written", label: "Written" },
  { value: "stub", label: "Stubs" },
  { value: "ghost", label: "Not written" },
];

/** `?status=ghost|stub|written` (from the Contribute page's links) picks the starting filter. */
function parseStatus(value: string | null): StatusFilter {
  return FILTERS.some((filter) => filter.value === value) ? (value as StatusFilter) : "all";
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function ListRoute() {
  const route = parseGraphPath(usePathname());
  const status = parseStatus(useSearchParams().get("status"));
  if (route?.view !== "list") return null;
  return <ListBody key={`${route.domain}:${status}`} domainId={route.domain} initialStatus={status} />;
}

/**
 * `/<domain>/list` (PDF page 6): the field's notes as a sortable table with a text filter and a
 * status filter. The accessible path to every note; rows open the same panel as the map.
 */
export function ListView() {
  return (
    <Suspense fallback={null}>
      <ListRoute />
    </Suspense>
  );
}

function ListBody({ domainId, initialStatus }: { domainId: string; initialStatus: StatusFilter }) {
  const data = useGraphStore((state) => state.data);
  const selectedId = useMapStore((state) => state.selectedId);
  const panelInset = useMapStore((state) => (state.selectedId ? state.insets.right : 0));
  const studiedSet = useProgressStore((state) => state.studiedSet);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [sort, setSort] = useState<Sort>({ key: "relations", direction: "desc" });

  const domain = data?.domains.find((entry) => entry.id === domainId);
  const all = useMemo(() => (data && domain ? listRows(data, domain.id, studiedSet) : []), [data, domain, studiedSet]);
  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const filtered = all.filter(
      (row) =>
        (status === "all" || row.status === status) &&
        (!needle || [row.node.title, row.cluster, row.level, ...row.node.tags, ...row.node.aliases].some((value) => value.toLowerCase().includes(needle))),
    );
    return sortRows(filtered, sort);
  }, [all, text, status, sort]);

  if (!domain) return null;

  const written = all.filter((row) => row.status !== "ghost").length;
  const stubs = all.filter((row) => row.status === "stub").length;
  const ghosts = all.length - written;
  const studied = all.filter((row) => row.studied).length;
  const onSort = (key: SortKey) =>
    setSort((current) => ({ key, direction: current.key === key ? (current.direction === "asc" ? "desc" : "asc") : key === "title" || key === "cluster" ? "asc" : "desc" }));

  return (
    <div
      className="absolute inset-0 z-canvas flex flex-col px-3 pt-23 pb-3 transition-[padding] duration-base ease-standard sm:px-6"
      style={panelInset ? { paddingRight: panelInset + 12 } : undefined}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1080px] flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="text-note-heading text-foreground">{domain.name} notes</h1>
            <p className="mt-1 text-ui-small font-normal text-faint tabular-nums">
              {plural(written, "note")} · {plural(stubs, "stub")} · {ghosts} not written yet · {studied} studied
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-60 max-sm:w-full">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-icon -translate-y-1/2 text-faint" />
              <Input type="search" aria-label="Filter notes" placeholder="Filter notes" value={text} onChange={(event) => setText(event.target.value)} className="h-8 pl-8.5" />
            </div>
            <Segmented label="Status" value={status} onValueChange={setStatus} options={FILTERS} />
          </div>
        </header>
        <div className="scroll-quiet mt-4 min-h-0 flex-1 overflow-auto rounded-surface border border-border bg-surface">
          <ListTable rows={rows} sort={sort} onSort={onSort} selectedId={selectedId} />
          {rows.length === 0 && <p className="px-4 py-6 text-ui font-normal text-muted-foreground">No notes match these filters.</p>}
        </div>
      </div>
    </div>
  );
}
