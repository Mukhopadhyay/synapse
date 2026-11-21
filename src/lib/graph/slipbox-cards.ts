import type { SlipboxConfig } from "../../config/slipbox.ts";
import type { GraphEdge, GraphNode } from "../content/schema.ts";

/** The drawer holds nine cards, and a card's tab has eight punches to count what it requires. */
export const SLIPBOX_MAX_CARDS = 9;
const MAX_REQUIRES = 8;
/** How many hops back the figure lifts, and so how far the hero's chain reads. */
export const SLIPBOX_REACH = 3;

export type SlipboxCard = {
  slug: string;
  title: string;
  /** The shortest of the title and its aliases ("RAG"), for the hero's chain. */
  label: string;
  /** Indexes of the cards this one requires, in filing order. */
  requires: number[];
};

export type Slipbox = { domain: string; cards: SlipboxCard[]; start: number };

type Source = { nodes: Pick<GraphNode, "id" | "title" | "aliases" | "ghost" | "domain">[]; edges: GraphEdge[] };

const quote = (slug: string) => `"${slug}"`;

/**
 * The slipbox's cards from the content: the configured notes in filing order, each with the cards it
 * requires (its own `requires`, kept to the drawer). `problems` says, in plain sentences, why the
 * drawer can't be drawn; `slipbox` is null whenever there are any.
 */
export function slipboxCards({ nodes, edges }: Source, { slugs, start }: SlipboxConfig): { slipbox: Slipbox | null; problems: string[] } {
  const problems: string[] = [];
  const byId = new Map(nodes.map((node) => [node.id, node]));

  if (slugs.length === 0 || slugs.length > SLIPBOX_MAX_CARDS) {
    problems.push(`the slipbox lists ${slugs.length} notes; it holds one to ${SLIPBOX_MAX_CARDS}.`);
  }
  const repeated = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (repeated.length > 0) problems.push(`${[...new Set(repeated)].map(quote).join(", ")} is listed more than once.`);
  const misfiled = slugs.findIndex((slug, index) => index > 0 && slug.localeCompare(slugs[index - 1]) < 0);
  if (misfiled > 0) problems.push(`the slipbox is filed a–z, so ${quote(slugs[misfiled])} goes before ${quote(slugs[misfiled - 1])}.`);
  if (!slugs.includes(start)) problems.push(`the start card ${quote(start)} isn't one of the slipbox's notes.`);

  for (const slug of slugs) {
    const node = byId.get(slug);
    if (!node) problems.push(`there's no note called ${quote(slug)}. Rename it here to match the note, or take it out.`);
    else if (node.ghost) problems.push(`${quote(slug)} has no note yet; only links point at it. Write it first, or take it out.`);
  }
  const domains = [...new Set(slugs.map((slug) => byId.get(slug)?.domain).filter(Boolean))];
  if (domains.length > 1) problems.push(`the slipbox files notes from one field, but these come from ${domains.join(" and ")}.`);

  const index = new Map(slugs.map((slug, position) => [slug, position]));
  const requires = slugs.map((slug) =>
    edges
      .filter((edge) => edge.kind === "requires" && edge.source === slug && index.has(edge.target))
      .map((edge) => index.get(edge.target)!)
      .sort((a, b) => a - b),
  );
  requires.forEach((list, position) => {
    if (list.length > MAX_REQUIRES) problems.push(`${quote(slugs[position])} requires ${list.length} of the other cards; a card can show ${MAX_REQUIRES}.`);
  });

  if (problems.length > 0) return { slipbox: null, problems: problems.map((problem) => `slipbox: ${problem}`) };

  const cards = slugs.map((slug, position) => {
    const node = byId.get(slug)!;
    const label = [node.title, ...node.aliases].reduce((shortest, name) => (name.length < shortest.length ? name : shortest));
    return { slug, title: node.title, label, requires: requires[position] };
  });
  return { slipbox: { domain: domains[0]!, cards, start: index.get(start)! }, problems };
}

/** Card `from` and what it requires, grouped by hop, as the figure lifts them: `[[from], [hop 1…], [hop 2…], [hop 3…]]`. */
export function requirementChain(cards: SlipboxCard[], from: number): number[][] {
  const seen = new Set([from]);
  const rows = [[from]];
  for (let hop = 0; hop < SLIPBOX_REACH; hop++) {
    const next = rows[hop].flatMap((card) => cards[card].requires).filter((card) => !seen.has(card) && seen.add(card));
    if (next.length === 0) break;
    rows.push(next);
  }
  return rows;
}
