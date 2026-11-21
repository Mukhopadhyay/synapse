import MiniSearch from "minisearch";

import type { GraphData, GraphNode } from "@/lib/content/schema";

import { isEmptyQuery, matchesOperators, type ParsedQuery } from "./query";
import { INDEX_OPTIONS, SEARCH_OPTIONS, type SearchDocument } from "./search-options";

export type SearchEngine = {
  /** Notes matching the query, best first. Operators alone list every match by importance. */
  search: (query: ParsedQuery) => GraphNode[];
  /** Tags in use, most used first, optionally narrowed by a prefix. */
  tags: (prefix: string) => { tag: string; count: number }[];
};

/** Matches only in a summary or body that score below this share of the best result are dropped (passing mentions). */
const RELEVANCE_FLOOR = 0.25;
const NAME_FIELDS = new Set(["title", "aliases", "tags"]);

let pending: Promise<MiniSearch<SearchDocument>> | null = null;

/** Without a built index (the stress graph), index titles, aliases, tags and summaries in the browser. */
function indexFromGraph(data: GraphData) {
  const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
  index.addAll(
    data.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      aliases: node.aliases.join(" "),
      tags: node.tags.join(" "),
      summary: node.summary ?? "",
      body: "",
    })),
  );
  return index;
}

function loadIndex(data: GraphData) {
  pending ??= fetch("/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error(`search-index.json: ${response.status}`);
      return response.text();
    })
    .then((json) => {
      const index = MiniSearch.loadJSON<SearchDocument>(json, INDEX_OPTIONS);
      return data.nodes.every((node) => index.has(node.id)) ? index : indexFromGraph(data);
    })
    .catch(() => indexFromGraph(data));
  return pending;
}

const byImportance = (a: GraphNode, b: GraphNode) =>
  Number(a.ghost) - Number(b.ghost) || b.relationCount - a.relationCount || a.title.localeCompare(b.title);

/** Loads the search index the first time it's needed; later calls share it. */
export async function loadSearchEngine(data: GraphData): Promise<SearchEngine> {
  const index = await loadIndex(data);
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));

  return {
    search(query) {
      if (isEmptyQuery(query)) return [];
      const passes = (node: GraphNode) => matchesOperators(node, query, data);
      if (!query.text) return data.nodes.filter(passes).sort(byImportance);
      const results = index.search(query.text, SEARCH_OPTIONS);
      const floor = (results[0]?.score ?? 0) * RELEVANCE_FLOOR;
      return results
        .filter((result) => result.score >= floor || Object.values(result.match).some((fields) => fields.some((field) => NAME_FIELDS.has(field))))
        .map((result) => nodes.get(String(result.id)))
        .filter((node): node is GraphNode => !!node && passes(node));
    },
    tags(prefix) {
      const counts = new Map<string, number>();
      for (const node of data.nodes) for (const tag of node.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const needle = prefix.toLowerCase().replace(/^#/, "");
      return [...counts]
        .filter(([tag]) => tag.toLowerCase().startsWith(needle))
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    },
  };
}
