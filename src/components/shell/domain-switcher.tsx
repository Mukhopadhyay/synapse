"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DomainColor } from "@/lib/content/relations";
import { ALL_FIELDS_HREF, graphHref, parseGraphPath } from "@/lib/content/note-url";
import { cn } from "@/lib/utils";

export type DomainSummary = { id: string; name: string; color: DomainColor; description?: string };

function DomainDot({ color }: { color: DomainColor }) {
  return <span aria-hidden data-node-dot="" data-domain={color} className="inline-block size-2 shrink-0 rounded-full" />;
}

/** A row in the switcher: dot, name, description, and a check on the current field. */
function DomainOption({ href, name, description, dots, current, onPick }: {
  href: string;
  name: string;
  description?: string;
  dots: DomainColor[];
  current: boolean;
  onPick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPick}
      aria-current={current ? "page" : undefined}
      className="flex items-start gap-3 rounded-control px-3 py-2 transition-colors duration-instant hover:bg-surface-raised"
    >
      <span className="flex h-5 shrink-0 items-center gap-0.5">
        {dots.map((color, index) => <DomainDot key={index} color={color} />)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui text-foreground">{name}</span>
        {description && <span className="text-ui-small font-normal text-muted-foreground">{description}</span>}
      </span>
      {current && <Check aria-hidden className="mt-0.5 size-icon shrink-0 text-muted-foreground" />}
    </Link>
  );
}

/**
 * The field switcher: the current field's dot and name, opening a list of every field in content/
 * plus "All fields" (the home map). Fields that don't exist yet are never listed.
 */
export function DomainSwitcher({ domains }: { domains: DomainSummary[] }) {
  const [open, setOpen] = useState(false);
  const route = parseGraphPath(usePathname());
  const active = domains.find((domain) => domain.id === route?.domain);
  const dots = active ? [active.color] : domains.map((domain) => domain.color);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-8 items-center gap-2 rounded-control px-3 text-ui text-foreground transition-colors duration-instant hover:bg-surface-raised aria-expanded:bg-surface-raised">
        <span className="flex items-center gap-0.5">
          {dots.map((color, index) => <DomainDot key={index} color={color} />)}
        </span>
        <span>{active?.name ?? "All fields"}</span>
        <ChevronDown aria-hidden className={cn("size-icon text-muted-foreground transition-transform duration-quick", open && "rotate-180")} />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className="w-72 p-1">
        <p className="px-3 pt-2 pb-1 text-overline text-faint uppercase">Fields</p>
        <DomainOption
          href={ALL_FIELDS_HREF}
          name="All fields"
          dots={domains.map((domain) => domain.color)}
          current={!active}
          onPick={() => setOpen(false)}
        />
        {domains.map((domain) => (
          <DomainOption
            key={domain.id}
            href={graphHref(domain.id)}
            name={domain.name}
            description={domain.description}
            dots={[domain.color]}
            current={active?.id === domain.id}
            onPick={() => setOpen(false)}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}
