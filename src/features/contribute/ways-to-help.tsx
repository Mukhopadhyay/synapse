import { Check, Circle, Pencil, type LucideIcon } from "lucide-react";

import { graphHref, listHref } from "@/lib/content/note-url";

import { ArrowLink, ContributeSection } from "./section";

type Way = { icon: LucideIcon; title: string; body: string; link: string; href: string };

function WayCard({ way }: { way: Way }) {
  const Icon = way.icon;
  return (
    <div className="flex flex-col rounded-surface border border-border bg-surface p-6">
      <span className="flex size-8 items-center justify-center rounded-control bg-surface-raised text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
      </span>
      <h3 className="mt-3 text-ui font-semibold text-foreground">{way.title}</h3>
      <p className="mt-3 flex-1 text-ui font-normal text-muted-foreground">{way.body}</p>
      <ArrowLink href={way.href} className="mt-2.5 self-start">
        {way.link}
      </ArrowLink>
    </div>
  );
}

/** Ghost, stub or fix: the three kinds of contribution, each linking to where to start. */
export function WaysToHelp({ domain }: { domain: string }) {
  const ways: Way[] = [
    {
      icon: Circle,
      title: "Write a ghost note",
      body: "Hollow circles on the map are notes that other notes already point to. Pick one and give it a first draft.",
      link: "See unwritten notes",
      href: `${listHref(domain)}?status=ghost`,
    },
    {
      icon: Pencil,
      title: "Finish a stub",
      body: "Stubs have a title and a summary but stop short. Add the explanation, an example, or the relations it's missing.",
      link: "See stubs",
      href: `${listHref(domain)}?status=stub`,
    },
    {
      icon: Check,
      title: "Improve a note",
      body: "Fix a mistake, tighten a paragraph or add a missing relation. Every note has an Edit on GitHub link.",
      link: "Browse the map",
      href: graphHref(domain),
    },
  ];
  return (
    <ContributeSection title="Three ways to help">
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ways.map((way) => (
          <WayCard key={way.title} way={way} />
        ))}
      </div>
    </ContributeSection>
  );
}
