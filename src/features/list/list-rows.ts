import { LEVEL_LABELS, LEVELS } from "@/lib/content/relations";
import type { GraphData, GraphNode } from "@/lib/content/schema";
import { noteRef, type NoteRef } from "@/lib/graph/note-view";

export type Status = "written" | "stub" | "ghost";
export type StatusFilter = "all" | Status;
export type SortKey = "title" | "cluster" | "level" | "relations" | "status";
export type Sort = { key: SortKey; direction: "asc" | "desc" };

export type ListRow = { node: GraphNode; ref: NoteRef; cluster: string; level: string; status: Status };

export const STATUS_LABELS: Record<Status, string> = { written: "Written", stub: "Stub", ghost: "Not written" };

const statusOf = (node: GraphNode): Status => (node.ghost ? "ghost" : node.stub ? "stub" : "written");

export function listRows(data: GraphData, domain: string): ListRow[] {
  return data.nodes
    .filter((node) => node.domain === domain)
    .map((node) => {
      const ref = noteRef(data, node);
      return { node, ref, cluster: ref.clusterName ?? "", level: node.level ? LEVEL_LABELS[node.level] : "", status: statusOf(node) };
    });
}

const STATUS_ORDER: Record<Status, number> = { written: 0, stub: 1, ghost: 2 };
const levelRank = (row: ListRow) => (row.node.level ? LEVELS.indexOf(row.node.level) : LEVELS.length);

/** Each column sorts by what it shows; ties fall back to title. */
export function sortRows(rows: ListRow[], { key, direction }: Sort) {
  const compare: Record<SortKey, (a: ListRow, b: ListRow) => number> = {
    title: () => 0,
    cluster: (a, b) => (a.ref.tint < 0 ? Infinity : a.ref.tint) - (b.ref.tint < 0 ? Infinity : b.ref.tint),
    level: (a, b) => levelRank(a) - levelRank(b),
    relations: (a, b) => a.node.relationCount - b.node.relationCount,
    status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  };
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => sign * compare[key](a, b) || sign * (key === "title" ? a.node.title.localeCompare(b.node.title) : 0) || a.node.title.localeCompare(b.node.title));
}
