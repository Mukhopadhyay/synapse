"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { NodeDot } from "@/components/node-dot";
import { Chip } from "@/components/ui/chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { noteHref } from "@/lib/content/note-url";
import { cn } from "@/lib/utils";

import { STATUS_LABELS, type ListRow, type Sort, type SortKey, type Status } from "./list-rows";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean; className?: string }[] = [
  { key: "title", label: "Title" },
  { key: "cluster", label: "Cluster", className: "w-[16%] @max-[44rem]:hidden" },
  { key: "level", label: "Level", className: "w-36 @max-[34rem]:hidden" },
  { key: "relations", label: "Relations", numeric: true, className: "w-28 @max-[34rem]:w-27" },
  { key: "status", label: "Status", className: "w-32 @max-[34rem]:w-24" },
];

const STATUS_CHIP: Record<Status, "default" | "outline" | "dashed"> = { written: "default", stub: "outline", ghost: "dashed" };

function SortHeader({ column, sort, onSort }: { column: (typeof COLUMNS)[number]; sort: Sort; onSort: (key: SortKey) => void }) {
  const active = sort.key === column.key;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("sticky top-0 z-10 h-10 bg-surface px-4 font-normal @max-[34rem]:px-3", column.numeric && "text-right", column.className)}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          "group/sort inline-flex items-center gap-1 rounded-chip align-middle text-ui-small transition-colors duration-instant hover:text-foreground",
          active ? "text-foreground" : "text-faint",
          column.numeric && "flex-row-reverse",
        )}
      >
        {column.label}
        <Icon aria-hidden className={cn("size-icon shrink-0", active ? "text-foreground" : "opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100")} />
      </button>
    </TableHead>
  );
}

/** The field's notes as a dense table. Every column sorts; a row opens the note in the same panel as the map. Columns follow the table's own width (container queries), so it also works squeezed beside an open note. */
export function ListTable({ rows, sort, onSort, selectedId }: { rows: ListRow[]; sort: Sort; onSort: (key: SortKey) => void; selectedId: string | null }) {
  return (
    <div className="@container">
      <Table className="table-fixed">
        <caption className="sr-only">Notes in this field. Column headers sort the table.</caption>
        <TableHeader className="[&_tr]:border-border">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <SortHeader key={column.key} column={column} sort={sort} onSort={onSort} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ node, ref, cluster, level, status }) => (
            <TableRow
              key={node.id}
              data-state={node.id === selectedId ? "selected" : undefined}
              className="relative h-10 border-border text-ui font-normal hover:bg-surface-raised data-[state=selected]:bg-surface-raised"
            >
              <TableCell className="px-4 py-2.5 @max-[34rem]:px-3">
                <Link
                  href={noteHref(node.domain, node.id, "list")}
                  scroll={false}
                  className="flex min-w-0 items-center gap-2.5 rounded-chip text-foreground after:absolute after:inset-0 after:content-['']"
                >
                  <NodeDot color={ref.color} tint={ref.tint} ghost={node.ghost} />
                  <span className="truncate">{node.title}</span>
                </Link>
              </TableCell>
              <TableCell className="truncate px-4 py-2.5 text-muted-foreground @max-[44rem]:hidden">{cluster || "—"}</TableCell>
              <TableCell className="px-4 py-2 @max-[34rem]:hidden">{level ? <Chip>{level}</Chip> : <span className="text-faint">—</span>}</TableCell>
              <TableCell className="px-4 py-2.5 text-right text-muted-foreground tabular-nums @max-[34rem]:px-3">{node.relationCount}</TableCell>
              <TableCell className="px-4 py-2 @max-[34rem]:px-3">
                <Chip variant={STATUS_CHIP[status]}>{STATUS_LABELS[status]}</Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
