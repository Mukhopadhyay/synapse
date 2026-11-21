import type { Metadata } from "next";

import { repoUrl } from "@/config/site";
import { ArrowLink } from "@/features/contribute/section";
import { Colophon } from "@/features/landing/colophon";
import { fieldStats } from "@/features/landing/field-stats";
import { FieldsTable } from "@/features/landing/fields-table";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import { LandingHero } from "@/features/landing/landing-hero";
import { LandingProse, LandingSection } from "@/features/landing/landing-section";
import { LoadGraphLink } from "@/features/landing/load-graph-link";
import { RelationLegend } from "@/features/landing/relation-legend";
import { loadGraph } from "@/lib/content/load-note";
import { proposeUrl } from "@/lib/content/propose-url";

export const metadata: Metadata = {
  title: { absolute: "Synapse — a map of how ideas lean on each other" },
  description:
    "Synapse explains one concept per short note and draws a line for every dependency: what to read first, what builds on it, what it's easily confused with.",
};

/** The landing page in front of the graph. Every count and the figure come from graph.json at build time; no map code ships here. */
export default async function LandingPage() {
  const data = await loadGraph();
  const fields = fieldStats(data);
  const firstDomain = data.domains[0]?.id;

  return (
    <div className="mx-auto w-full max-w-300 px-4 sm:px-6">
      <LandingHeader />
      <main>
        <LandingHero data={data} fields={fields} />

        <LandingSection id="the-idea" number="01" title="The idea">
          <LandingProse>
            <p>
              Most explanations start somewhere in the middle. They assume you already know three other things, and rarely say which.{" "}
              <strong className="font-medium text-foreground">Synapse makes those assumptions explicit.</strong> Every note says what it requires, what it
              extends and what it contrasts with — so you can start at whatever you&apos;re curious about and walk backwards until it makes sense.
            </p>
            <p>Notes are short on purpose: one idea, a summary sentence, an example. The map does the rest.</p>
          </LandingProse>
        </LandingSection>

        <LandingSection id="reading-the-map" number="02" title="Reading the map">
          <LandingProse>
            <p>Each dot is a note, sized by how much depends on it. Colour is the field. Hover anything to quiet the rest of the map; click to read it.</p>
          </LandingProse>
          <RelationLegend />
        </LandingSection>

        <LandingSection id="the-fields" number="03" title="The fields">
          <LandingProse>
            <p>Large language models first. Fields link across each other — a KV cache is a cache, after all.</p>
          </LandingProse>
          <FieldsTable fields={fields} />
        </LandingSection>

        <LandingSection id="write-a-note" number="04" title="Write a note">
          <LandingProse>
            <p>
              Every note is a Markdown file in a public repository, and the map is rebuilt from those files on every merge. Finish a stub, write one of the
              hollow circles, or fix something that&apos;s wrong.
            </p>
          </LandingProse>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <ArrowLink href="/contribute">How contributing works</ArrowLink>
            {firstDomain && (
              <ArrowLink href={proposeUrl("Your note title", firstDomain, data.template)} external>
                Draft a note in your browser
              </ArrowLink>
            )}
          </div>
        </LandingSection>

        <LandingSection id="colophon" number="05" title="Colophon">
          <Colophon />
        </LandingSection>

        <section aria-label="Open the map" className="flex flex-col gap-8 border-t border-border py-24 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg font-serif text-display-small text-balance text-foreground max-sm:text-note-title">
            Start anywhere. The map keeps your place.
          </p>
          <LoadGraphLink size="lg" arrow className="self-start sm:self-auto" />
        </section>
      </main>
      <LandingFooter repo={repoUrl} />
    </div>
  );
}
