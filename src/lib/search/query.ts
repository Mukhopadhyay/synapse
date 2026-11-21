import { LEVEL_LABELS, type GraphData, type GraphNode } from "@/lib/content/schema";

/**
 * Search syntax, shared by the palette, the map's filter box and groups:
 * free text plus `tag:`, `level:`, `cluster:` and `is:stub | is:ghost | is:written`.
 * Values match by prefix and ignore case: `level:adv`, `cluster:retr`.
 */
export type ParsedQuery = {
  text: string;
  tags: string[];
  levels: string[];
  clusters: string[];
  is: ("stub" | "ghost" | "written")[];
};

export const QUERY_OPERATORS = ["tag", "level", "cluster", "is"] as const;
const IS_VALUES = ["stub", "ghost", "written"] as const;

export function parseQuery(input: string): ParsedQuery {
  const query: ParsedQuery = { text: "", tags: [], levels: [], clusters: [], is: [] };
  const words: string[] = [];
  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    const match = /^(tag|level|cluster|is):(.+)$/i.exec(token);
    if (!match) {
      words.push(token);
      continue;
    }
    const value = match[2].toLowerCase();
    const operator = match[1].toLowerCase();
    if (operator === "tag") query.tags.push(value.replace(/^#/, ""));
    else if (operator === "level") query.levels.push(value);
    else if (operator === "cluster") query.clusters.push(value);
    else {
      const flag = IS_VALUES.find((candidate) => candidate.startsWith(value));
      if (flag) query.is.push(flag);
    }
  }
  query.text = words.join(" ");
  return query;
}

export const hasOperators = (query: ParsedQuery) =>
  query.tags.length + query.levels.length + query.clusters.length + query.is.length > 0;

export const isEmptyQuery = (query: ParsedQuery) => !query.text && !hasOperators(query);

const startsWithAny = (values: string[], candidates: (string | undefined)[]) =>
  values.some((value) => candidates.some((candidate) => candidate?.toLowerCase().startsWith(value)));

/** Whether a note passes the query's operators (free text is matched by the search engine). Operators of one kind are OR, kinds are AND. */
export function matchesOperators(node: GraphNode, query: ParsedQuery, data: GraphData) {
  if (query.tags.length && !startsWithAny(query.tags, node.tags)) return false;
  if (query.levels.length && !startsWithAny(query.levels, [node.level, node.level && LEVEL_LABELS[node.level]])) return false;
  if (query.clusters.length) {
    const clusterName = data.domains.find((domain) => domain.id === node.domain)?.clusters.find((cluster) => cluster.id === node.cluster)?.name;
    if (!startsWithAny(query.clusters, [node.cluster, clusterName])) return false;
  }
  if (query.is.length) {
    const status = node.ghost ? "ghost" : node.stub ? "stub" : "written";
    if (!query.is.includes(status)) return false;
  }
  return true;
}
