import MiniSearch from "minisearch";

import type { GraphNode } from "../../src/lib/content/schema.ts";
import { INDEX_OPTIONS, type SearchDocument } from "../../src/lib/search/search-options.ts";

/** The palette's search index: every note and ghost, with body text for written notes. Loaded lazily by the browser. */
export function buildSearchIndex(nodes: GraphNode[], bodies: Map<string, string>) {
  const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
  index.addAll(
    nodes.map((node) => ({
      id: node.id,
      title: node.title,
      aliases: node.aliases.join(" "),
      tags: node.tags.join(" "),
      summary: node.summary ?? "",
      body: bodies.get(node.id) ?? "",
    })),
  );
  return JSON.stringify(index);
}
