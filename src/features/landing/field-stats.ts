import type { DomainColor } from "@/lib/content/relations";
import type { GraphData } from "@/lib/content/schema";

export type FieldStats = {
  id: string;
  name: string;
  color: DomainColor;
  /** Written + stubs + unwritten. */
  notes: number;
  written: number;
  stubs: number;
  /** Slugs other notes link to that have no file yet (ghosts). */
  unwritten: number;
};

/** Per-field counts for the landing page, straight from graph.json at build time. */
export function fieldStats(data: GraphData): FieldStats[] {
  return data.domains.map((domain) => {
    const nodes = data.nodes.filter((node) => node.domain === domain.id);
    const unwritten = nodes.filter((node) => node.ghost).length;
    const stubs = nodes.filter((node) => !node.ghost && node.stub).length;
    const written = nodes.filter((node) => !node.ghost && !node.stub).length;
    return { id: domain.id, name: domain.name, color: domain.color, notes: written + stubs + unwritten, written, stubs, unwritten };
  });
}

export function totalNotes(stats: FieldStats[]) {
  return stats.reduce((sum, field) => sum + field.notes, 0);
}
