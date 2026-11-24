import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { promisify } from "node:util";

import type { GraphData } from "../src/lib/content/schema.ts";
import { nodeRadius } from "../src/lib/graph/node-size.ts";
import { computeLayout } from "./lib/layout.ts";

const run = promisify(execFile);
const fixture = (name: string) => path.join(import.meta.dirname, "__fixtures__", name);
const script = path.join(import.meta.dirname, "build-graph.ts");

/** Runs the build script against a fixture; resolves with its exit code and combined output. */
async function build(name: string, extra: string[] = []) {
  try {
    const { stdout, stderr } = await run(process.execPath, [script, "--content", fixture(name), ...extra], { env: { ...process.env, NO_COLOR: "1" } });
    return { code: 0, output: stdout + stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, output: failed.stdout + failed.stderr };
  }
}

describe("pnpm check", () => {
  it("passes valid content and reports unwritten notes as warnings", async () => {
    const { code, output } = await build("valid", ["--check"]);
    assert.equal(code, 0, output);
    assert.match(output, /"gamma" has no note yet/);
  });

  it("fails on a requires cycle and names the loop", async () => {
    const { code, output } = await build("cycle", ["--check"]);
    assert.equal(code, 1);
    assert.match(output, /requires goes round in a circle: alpha → beta → alpha/);
  });

  it("fails on a duplicate slug", async () => {
    const { code, output } = await build("duplicate-slug", ["--check"]);
    assert.equal(code, 1);
    assert.match(output, /the slug "alpha" is already used by/);
  });

  it("fails on an unknown key and suggests the right one", async () => {
    const { code, output } = await build("bad-key", ["--check"]);
    assert.equal(code, 1);
    assert.match(output, /unknown key "require". Did you mean "requires"\?/);
  });

  it("fails on a near-miss target with a suggestion instead of making a ghost", async () => {
    const { code, output } = await build("typo", ["--check"]);
    assert.equal(code, 1);
    assert.match(output, /no note called "atention". Did you mean "attention"\?/);
  });
});

describe("graph.json", () => {
  const dir = mkdtemp(path.join(tmpdir(), "synapse-test-"));
  after(async () => rm(await dir, { recursive: true, force: true }));

  it("emits nodes, ghosts, edges, positions and the note template", async () => {
    const out = path.join(await dir, "graph.json");
    const { code, output } = await build("valid", ["--out", out, "--bodies", path.join(await dir, "bodies")]);
    assert.equal(code, 0, output);
    const data: GraphData = JSON.parse(await readFile(out, "utf8"));

    assert.deepEqual(data.nodes.map((node) => node.id), ["alpha", "beta", "gamma"]);
    assert.equal(data.nodes.find((node) => node.id === "gamma")?.ghost, true);
    assert.equal(data.nodes.find((node) => node.id === "gamma")?.title, "GAMMA function");
    assert.equal(data.nodes.find((node) => node.id === "alpha")?.relationCount, 2);
    assert.ok(data.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)));
    assert.ok(data.edges.some((edge) => edge.kind === "requires" && edge.source === "alpha" && edge.target === "beta"));
    assert.match(data.template, /\{\{title\}\}/);

    const index = JSON.parse(await readFile(path.join(await dir, "search-index.json"), "utf8"));
    assert.equal(index.documentCount, 3);
  });

  it("drops a mention when the same pair already has a typed relation, in either direction", async () => {
    const out = path.join(await dir, "mentions.json");
    const { code, output } = await build("mentions", ["--out", out, "--bodies", path.join(await dir, "mentions-bodies")]);
    assert.equal(code, 0, output);
    const data: GraphData = JSON.parse(await readFile(out, "utf8"));
    const edges = data.edges.map(({ source, target, kind }) => `${source} ${kind} ${target}`).sort();
    assert.deepEqual(edges, ["alpha requires beta", "beta mentions gamma"]);
  });
});

describe("layout", () => {
  const nodes = ["a", "b", "c", "d"].map((id, index) => ({ id, domain: "test", cluster: index < 2 ? "x" : "y", size: 6 }));
  const edges = [
    { source: "a", target: "b", kind: "requires" as const },
    { source: "c", target: "d", kind: "related" as const },
    { source: "b", target: "c", kind: "contrasts" as const },
  ];

  it("is identical on every run", () => {
    assert.deepEqual([...computeLayout(nodes, edges)], [...computeLayout(nodes, edges)]);
  });

  it("keeps nodes apart", () => {
    const positions = [...computeLayout(nodes, edges).values()];
    for (const [i, a] of positions.entries()) {
      for (const b of positions.slice(i + 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 12);
    }
  });
});

describe("node size", () => {
  it("grows steeply with links and caps at 16", () => {
    assert.equal(nodeRadius(0), 3);
    assert.ok(nodeRadius(4) / nodeRadius(1) > 1.9);
    assert.equal(nodeRadius(100), 16);
  });
});
