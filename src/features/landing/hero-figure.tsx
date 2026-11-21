"use client";

import { Fragment, useMemo, useState, type FocusEvent } from "react";
import Link from "next/link";

import { Slipbox } from "@/components/hairline/slipbox";
import { Chip } from "@/components/ui/chip";
import { ALL_FIELDS_HREF, noteHref } from "@/lib/content/note-url";
import { requirementChain, type Slipbox as SlipboxData } from "@/lib/graph/slipbox-cards";
import { cn } from "@/lib/utils";

/** The chosen note, then each hop back fainter. */
const HOP_TONE = ["font-medium text-foreground", "text-muted-foreground", "text-faint", "text-faint"];

type Props = {
  slipbox: SlipboxData;
  /** The field's display name ("LLM"). */
  field: string;
  /** How many notes the field has, for "9 of 21 notes". */
  fieldNotes: number;
};

/**
 * Fig. 1: the field's slipbox in a frame that opens the note the figure last named, or the graph at
 * rest. It plays its tour until a pointer arrives; keyboard focus on the frame pauses it, so Enter
 * always opens what the label says. The caption under the drawing follows the card being read; it's
 * announced only while a person points at the figure, never for the tour's stops.
 */
export function HeroFigure({ slipbox, field, fieldNotes }: Props) {
  const { domain, cards, start } = slipbox;
  const notes = useMemo(() => cards.map((card) => [card.slug, card.requires] as const), [cards]);
  const [reading, setReading] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [pointer, setPointer] = useState(false);

  const onRead = (text: string) => {
    const card = cards.findIndex((entry) => entry.slug === text.split(" ")[0]);
    setReading(card < 0 ? null : card);
  };
  const onFocus = (event: FocusEvent<HTMLAnchorElement>) => setHeld(event.currentTarget.matches(":focus-visible"));

  const resting = reading === null;
  const shown = cards[reading ?? start];
  const chain = requirementChain(cards, reading ?? start);
  const name = field.toLowerCase();

  return (
    <figure className="min-w-0 split:hero-recede">
      <div className="group relative">
        <Link
          href={resting ? ALL_FIELDS_HREF : noteHref(domain, shown.slug)}
          prefetch={false}
          aria-label={resting ? "Open the full graph" : `Open ${shown.title}`}
          onFocus={onFocus}
          onBlur={() => setHeld(false)}
          onPointerEnter={() => setPointer(true)}
          onPointerLeave={() => setPointer(false)}
          className="relative flex h-130 items-center justify-center overflow-hidden rounded-surface border border-border px-4 pt-6 pb-18 transition-colors duration-quick ease-standard group-hover:border-border-strong max-sm:h-100"
        >
          <Slipbox notes={notes} start={start} play={!held} onRead={onRead} className="hairline w-full max-w-132.5 max-sm:max-w-95" />
          <Chip className="absolute right-3 bottom-3 text-muted-foreground transition-colors duration-instant ease-standard group-hover:bg-surface group-hover:text-foreground">
            Open graph <span aria-hidden>→</span>
          </Chip>
        </Link>

        <p aria-hidden className="pointer-events-none absolute top-3.5 left-4 flex items-center gap-2 font-mono text-meta text-faint">
          <span className={cn("size-1.5 rounded-full transition-colors duration-quick ease-standard", resting ? "bg-faint" : "bg-signal")} />
          {resting ? `${name} · slipbox · filed a–z` : `${name} · reading backwards`}
        </p>

        <div aria-live={pointer ? "polite" : "off"} className="pointer-events-none absolute right-35 bottom-3.5 left-4 flex flex-col gap-1">
          <span className="font-mono text-meta text-faint">{noteHref(domain, shown.slug)}</span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-ui-small font-normal">
            {chain.map((row, hop) => (
              <Fragment key={hop}>
                {hop > 0 && (
                  <span className="font-mono text-meta text-faint">
                    <span aria-hidden>←</span>
                    <span className="sr-only">requires</span>
                  </span>
                )}
                <span className={cn("transition-colors duration-quick ease-standard", HOP_TONE[hop])}>{row.map((card) => cards[card].label).join(", ")}</span>
              </Fragment>
            ))}
            {chain.length === 1 && <span className="text-faint">— a foundation, nothing to read first</span>}
            {resting && <span className="text-faint">· start here, or point at any card</span>}
          </span>
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-meta text-faint">
        <span>Fig. 1 — The {field} slipbox. Point at a card: what it leans on rises after it.</span>
        <span>
          {cards.length} of {fieldNotes} notes · filed a–z
        </span>
      </figcaption>
    </figure>
  );
}
