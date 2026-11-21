import { notePath } from "@/lib/content/note-path";
import {
  MENTIONS,
  RELATION_KEYS,
  RELATIONS,
  type DomainColor,
  type EdgeKind,
  type LineStyle,
} from "@/lib/content/relations";
import type { GraphData, GraphNode } from "@/lib/content/schema";

/** A note as a relation row shows it: dot colour, title, cluster. */
export type NoteRef = {
  id: string;
  domain: string;
  title: string;
  ghost: boolean;
  color: DomainColor;
  /** Cluster position in `_domain.yml`, which picks the tint; -1 for no cluster. */
  tint: number;
  clusterName?: string;
};

export type RelationGroup = { id: string; label: string; line: LineStyle; notes: NoteRef[] };

/** Everything the note panel shows except the body. Shared by note pages and the instant panel. */
export type NoteView = {
  node: GraphNode;
  ref: NoteRef;
  breadcrumb: string;
  path: string;
  relations: RelationGroup[];
};

export function noteRef(data: GraphData, node: GraphNode): NoteRef {
  const domain = data.domains.find((entry) => entry.id === node.domain);
  const tint = domain?.clusters.findIndex((cluster) => cluster.id === node.cluster) ?? -1;
  return {
    id: node.id,
    domain: node.domain,
    title: node.title,
    ghost: node.ghost,
    color: domain?.color ?? "domain-1",
    tint,
    clusterName: tint >= 0 ? domain?.clusters[tint].name : undefined,
  };
}

/** "LLM › Retrieval", or just the domain name for notes without a cluster. */
export function breadcrumb(data: GraphData, node: GraphNode) {
  const domain = data.domains.find((entry) => entry.id === node.domain);
  if (!domain) return "";
  const cluster = domain.clusters.find((entry) => entry.id === node.cluster);
  return cluster ? `${domain.name} › ${cluster.name}` : domain.name;
}

/**
 * Relations of a note in both directions, grouped in the order of the relation definition:
 * Requires, Required by, Extends, Extended by, Related, Contrasts, then Mentioned by.
 * Undirected relations merge both directions into one group. Empty groups are dropped.
 */
export function relationGroups(data: GraphData, id: string): RelationGroup[] {
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<EdgeKind, string[]>();
  const incoming = new Map<EdgeKind, string[]>();
  for (const { source, target, kind } of data.edges) {
    if (source === id) outgoing.set(kind, [...(outgoing.get(kind) ?? []), target]);
    if (target === id) incoming.set(kind, [...(incoming.get(kind) ?? []), source]);
  }

  const refs = (ids: string[] = []) =>
    [...new Set(ids)]
      .map((other) => nodes.get(other))
      .filter((node): node is GraphNode => Boolean(node))
      .map((node) => noteRef(data, node))
      .sort((a, b) => Number(a.ghost) - Number(b.ghost) || a.title.localeCompare(b.title));

  const groups: RelationGroup[] = [];
  for (const key of RELATION_KEYS) {
    const definition = RELATIONS[key];
    if (definition.directed) {
      groups.push({ id: `${key}:out`, label: definition.label, line: definition.line, notes: refs(outgoing.get(key)) });
      groups.push({ id: `${key}:in`, label: definition.inverseLabel, line: definition.line, notes: refs(incoming.get(key)) });
    } else {
      const both = [...(outgoing.get(key) ?? []), ...(incoming.get(key) ?? [])];
      groups.push({ id: key, label: definition.label, line: definition.line, notes: refs(both) });
    }
  }
  groups.push({ id: "mentions:in", label: MENTIONS.inverseLabel, line: MENTIONS.line, notes: refs(incoming.get("mentions")) });
  return groups.filter((group) => group.notes.length > 0);
}

export function noteView(data: GraphData, id: string): NoteView | null {
  const node = data.nodes.find((entry) => entry.id === id);
  if (!node) return null;
  return {
    node,
    ref: noteRef(data, node),
    breadcrumb: breadcrumb(data, node),
    path: notePath(node),
    relations: relationGroups(data, id),
  };
}
