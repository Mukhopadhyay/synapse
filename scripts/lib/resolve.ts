import {
  RELATION_KEYS,
  RELATIONS,
  STUB_WORD_LIMIT,
  type EdgeKind,
  type GraphEdge,
  type GraphNode,
} from "../../src/lib/content/schema.ts";
import type { LoadedNote } from "./load-content.ts";
import type { Report } from "./report.ts";
import { didYouMean } from "./suggest.ts";
import { extractWikilinks } from "./wikilinks.ts";
import { countBodyWords } from "./word-count.ts";

export type DraftNode = Omit<GraphNode, "importance" | "relationCount" | "x" | "y">;

type Referrer = { from: string; domain: string; cluster?: string; qualifiedDomain?: string };

function titleFromSlug(slug: string) {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Most common value; ties go to the alphabetically first. */
function mostCommon(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

/**
 * Turns loaded notes into nodes and edges: resolves every relation and wikilink target,
 * creates ghost nodes for targets that don't exist yet, and reports duplicates, self-links and typos.
 * A wikilink between two notes that already share a typed relation (either way) adds no mention edge.
 */
export function resolveGraph(notes: LoadedNote[], report: Report, ghostTitles: Map<string, { title: string; file: string }> = new Map()) {
  const bySlug = new Map<string, LoadedNote>();
  for (const note of notes) {
    const existing = bySlug.get(note.slug);
    if (existing) {
      report.error(
        note.file,
        `the slug "${note.slug}" is already used by ${existing.file}. Slugs must be unique across every field; rename one of the files.`,
      );
      continue;
    }
    bySlug.set(note.slug, note);
  }

  const slugs = [...bySlug.keys()];
  const ghosts = new Map<string, Referrer[]>();
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();

  function resolveTarget(note: LoadedNote, target: string, describe: string): string | null {
    const [qualifiedDomain, bare] = target.includes("/") ? target.split("/") : [undefined, target];
    const match = bySlug.get(bare);
    if (match && (!qualifiedDomain || match.domain === qualifiedDomain)) return match.slug;

    const suggestion = didYouMean(bare, slugs);
    if (suggestion) {
      report.error(note.file, `${describe} — no note called "${target}". Did you mean "${suggestion}"?`);
      return null;
    }
    ghosts.set(bare, [
      ...(ghosts.get(bare) ?? []),
      { from: note.slug, domain: note.domain, cluster: note.cluster, qualifiedDomain },
    ]);
    return bare;
  }

  function addEdge(source: string, target: string, kind: EdgeKind) {
    const directed = kind === "mentions" || RELATIONS[kind].directed;
    const pair = directed ? `${source}>${target}` : [source, target].sort().join("~");
    const key = `${kind}:${pair}`;
    if (edgeKeys.has(key)) return false;
    edgeKeys.add(key);
    edges.push({ source, target, kind });
    return true;
  }

  for (const note of bySlug.values()) {
    const linked = new Map<string, string>();

    for (const kind of RELATION_KEYS) {
      for (const target of note.frontmatter[kind]) {
        const describe = `${kind}: [${target}]`;
        if (target === note.slug || target === `${note.domain}/${note.slug}`) {
          report.error(note.file, `${describe} — a note can't link to itself.`);
          continue;
        }
        const id = resolveTarget(note, target, describe);
        if (!id) continue;

        const previous = linked.get(id);
        if (previous) {
          report.warn(note.file, `"${target}" is listed under both ${previous} and ${kind}. Keep the one that fits best.`);
        }
        linked.set(id, kind);

        if (!addEdge(note.slug, id, kind)) {
          report.warn(note.file, `${describe} — "${id}" already lists this note under ${kind}. One side is enough.`);
        }
      }
    }

    for (const target of extractWikilinks(note.body)) {
      if (target === note.slug) continue;
      const id = resolveTarget(note, target, `the body links to [[${target}]]`);
      if (id) addEdge(note.slug, id, "mentions");
    }
  }

  const pairKey = (edge: GraphEdge) => [edge.source, edge.target].sort().join("~");
  const typedPairs = new Set(edges.filter((edge) => edge.kind !== "mentions").map(pairKey));
  const keptEdges = edges.filter((edge) => edge.kind !== "mentions" || !typedPairs.has(pairKey(edge)));

  const nodes: DraftNode[] = [...bySlug.values()].map((note) => ({
    id: note.slug,
    title: note.frontmatter.title,
    summary: note.frontmatter.summary,
    level: note.frontmatter.level,
    tags: note.frontmatter.tags,
    aliases: note.frontmatter.aliases,
    domain: note.domain,
    cluster: note.cluster,
    ghost: false,
    stub: countBodyWords(note.body) < STUB_WORD_LIMIT,
  }));

  for (const [slug, referrers] of ghosts) {
    const from = [...new Set(referrers.map((referrer) => referrer.from))];
    report.warn("not written yet", `"${slug}" has no note yet (linked from ${from.join(", ")}). It will show as "Not written yet".`);
    const domain = mostCommon(referrers.map((r) => r.qualifiedDomain ?? r.domain))!;
    nodes.push({
      id: slug,
      title: ghostTitles.get(slug)?.title ?? titleFromSlug(slug),
      tags: [],
      aliases: [],
      domain,
      cluster: mostCommon(referrers.filter((r) => r.domain === domain).map((r) => r.cluster)),
      ghost: true,
      stub: false,
    });
  }

  for (const [slug, { file }] of ghostTitles) {
    if (bySlug.has(slug)) report.warn(file, `ghosts: "${slug}" has been written now; its title comes from the note, so remove this line.`);
    else if (!ghosts.has(slug)) report.warn(file, `ghosts: nothing links to "${slug}", so this title isn't used.`);
  }

  return { nodes, edges: keptEdges, files: new Map([...bySlug].map(([slug, note]) => [slug, note.file])) };
}
