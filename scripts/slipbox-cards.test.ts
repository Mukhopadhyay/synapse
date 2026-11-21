import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SLIPBOX } from "../src/config/slipbox.ts";
import type { GraphEdge } from "../src/lib/content/schema.ts";
import { requirementChain, slipboxCards } from "../src/lib/graph/slipbox-cards.ts";

const note = (id: string, extra: { ghost?: boolean; domain?: string; aliases?: string[] } = {}) => ({
  id,
  title: id[0].toUpperCase() + id.slice(1),
  aliases: extra.aliases ?? [],
  ghost: extra.ghost ?? false,
  domain: extra.domain ?? "ai",
});
const requires = (source: string, target: string): GraphEdge => ({ source, target, kind: "requires" });

const nodes = [note("alpha"), note("beta", { aliases: ["B"] }), note("gamma"), note("delta"), note("ghosted", { ghost: true })];
const edges = [requires("alpha", "beta"), requires("alpha", "delta"), requires("beta", "gamma"), { source: "gamma", target: "alpha", kind: "related" as const }];

describe("slipbox", () => {
  it("files the cards a–z with what each requires among them", () => {
    const { slipbox, problems } = slipboxCards({ nodes, edges }, { slugs: ["alpha", "beta", "gamma"], start: "beta" });
    assert.deepEqual(problems, []);
    assert.equal(slipbox?.start, 1);
    assert.equal(slipbox?.domain, "ai");
    assert.deepEqual(
      slipbox?.cards.map(({ slug, requires }) => [slug, requires]),
      [["alpha", [1]], ["beta", [2]], ["gamma", []]],
    );
    assert.equal(slipbox?.cards[1].label, "B");
  });

  it("fails on a missing note, a ghost, a misfiled card and a stray start", () => {
    const { slipbox, problems } = slipboxCards({ nodes, edges }, { slugs: ["beta", "alpha", "ghosted", "zeta"], start: "omega" });
    assert.equal(slipbox, null);
    assert.ok(problems.some((problem) => /there's no note called "zeta"/.test(problem)));
    assert.ok(problems.some((problem) => /"ghosted" has no note yet/.test(problem)));
    assert.ok(problems.some((problem) => /"alpha" goes before "beta"/.test(problem)));
    assert.ok(problems.some((problem) => /start card "omega"/.test(problem)));
  });

  it("fails on more than nine cards or notes from two fields", () => {
    const many = Array.from({ length: 10 }, (_, index) => note(`n${index}`));
    assert.match(slipboxCards({ nodes: many, edges: [] }, { slugs: many.map((n) => n.id), start: "n0" }).problems.join(), /holds one to 9/);
    const mixed = [note("alpha"), note("beta", { domain: "backend" })];
    assert.match(slipboxCards({ nodes: mixed, edges: [] }, { slugs: ["alpha", "beta"], start: "alpha" }).problems.join(), /from one field/);
  });

  it("reads a card's requirements back hop by hop, three hops at most", () => {
    const card = (requires: number[]) => ({ slug: "", title: "", label: "", requires });
    const cards = [card([1]), card([2, 3]), card([3]), card([4]), card([5]), card([])];
    assert.deepEqual(requirementChain(cards, 0), [[0], [1], [2, 3], [4]]);
    assert.deepEqual(requirementChain(cards, 5), [[5]]);
  });

  it("is drawn from the repo's content", async (t) => {
    const { readFile } = await import("node:fs/promises");
    const data = JSON.parse(await readFile(new URL("../public/graph.json", import.meta.url), "utf8").catch(() => "null"));
    if (!data) return t.skip("public/graph.json isn't built yet; pnpm check covers the content");
    const { slipbox, problems } = slipboxCards(data, SLIPBOX);
    assert.deepEqual(problems, []);
    assert.equal(slipbox?.cards.length, 9);
  });
});
