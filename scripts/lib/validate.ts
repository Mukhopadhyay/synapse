import { RELATION_KEYS, RELATIONS, type GraphEdge } from "../../src/lib/content/schema.ts";
import type { Report } from "./report.ts";

/** Every distinct cycle in one directed relation, each as a closed path (a → b → a). */
function findCycles(edges: GraphEdge[]): string[][] {
  const next = new Map<string, string[]>();
  for (const { source, target } of edges) next.set(source, [...(next.get(source) ?? []), target]);

  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const cycles = new Map<string, string[]>();

  function visit(node: string) {
    state.set(node, "visiting");
    stack.push(node);
    for (const target of next.get(node) ?? []) {
      if (state.get(target) === "visiting") {
        const loop = stack.slice(stack.indexOf(target));
        const start = loop.indexOf([...loop].sort()[0]);
        const canonical = [...loop.slice(start), ...loop.slice(0, start)];
        cycles.set(canonical.join(">"), [...canonical, canonical[0]]);
      } else if (!state.has(target)) {
        visit(target);
      }
    }
    stack.pop();
    state.set(node, "done");
  }

  for (const node of [...next.keys()].sort()) if (!state.has(node)) visit(node);
  return [...cycles.values()];
}

export function checkAcyclic(edges: GraphEdge[], files: Map<string, string>, report: Report) {
  for (const kind of RELATION_KEYS.filter((key) => RELATIONS[key].acyclic)) {
    for (const cycle of findCycles(edges.filter((edge) => edge.kind === kind))) {
      report.error(
        files.get(cycle[0]),
        `${kind} goes round in a circle: ${cycle.join(" → ")}. "${kind}" links can't loop back; remove or change one of them.`,
      );
    }
  }
}
