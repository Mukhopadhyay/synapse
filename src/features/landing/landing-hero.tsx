import { Button } from "@/components/ui/button";
import { REPO, repoUrl } from "@/config/site";
import { SLIPBOX } from "@/config/slipbox";
import type { GraphData } from "@/lib/content/schema";
import { slipboxCards } from "@/lib/graph/slipbox-cards";

import { totalNotes, type FieldStats } from "./field-stats";
import { HeroFigure } from "./hero-figure";
import { LoadGraphLink } from "./load-graph-link";

/** Fig. 1's cards, from graph.json at build time. A slipbox that no longer matches the content fails the build. */
function heroSlipbox(data: GraphData, fields: FieldStats[]) {
  const { slipbox, problems } = slipboxCards(data, SLIPBOX);
  if (!slipbox) throw new Error(`The landing page's Fig. 1 can't be drawn:\n${problems.join("\n")}`);
  const field = fields.find((entry) => entry.id === slipbox.domain)!;
  return { slipbox, field: field.name, fieldNotes: field.notes };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function LandingHero({ data, fields }: { data: GraphData; fields: FieldStats[] }) {
  const figure = heroSlipbox(data, fields);
  return (
    <section aria-labelledby="landing-title" className="grid gap-12 pt-10 pb-24 split:grid-cols-[minmax(0,30rem)_minmax(0,38rem)] split:justify-between split:gap-16 split:pt-18">
      <div className="split:pt-5.5">
        <p className="font-mono text-meta text-faint">An open knowledge graph · v2</p>
        <h1 id="landing-title" className="mt-4 font-serif text-display text-balance text-foreground max-sm:text-display-mobile">
          A map of how ideas lean on each other.
        </h1>
        <p className="mt-9 max-w-116 text-lead text-muted-foreground">
          Synapse explains one concept per short note and draws a line for every dependency — what to read first, what builds on it, what it&apos;s easily
          confused with. It starts with large language models.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LoadGraphLink size="lg" arrow />
          <Button asChild variant="ghost" size="lg">
            <a href="#reading-the-map">How to read it</a>
          </Button>
        </div>
        <p className="mt-10 font-mono text-meta text-faint">
          {plural(totalNotes(fields), "note")} · {plural(fields.length, "field")} ·{" "}
          <a href={repoUrl} target="_blank" rel="noreferrer" className="rounded-chip text-muted-foreground transition-colors duration-instant hover:text-foreground">
            github.com/{REPO.owner}/{REPO.name}
          </a>
        </p>
      </div>
      <HeroFigure {...figure} />
    </section>
  );
}
