"use client";

import * as React from "react";
import Link from "next/link";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/**
 * Segmented controls (PDF: Map · List, the list's status filter): a `surface-raised` track with
 * 4px padding, the active item on `surface`. `Segmented` picks a value (ToggleGroup);
 * `SegmentedLinks` switches routes.
 */
const track = "gap-1 rounded-control bg-surface-raised p-1";
const item =
  "flex h-6 items-center rounded-chip px-2 text-ui-small text-muted-foreground transition-colors duration-instant hover:text-foreground";
const active = "bg-surface text-foreground inset-ring inset-ring-border";

function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
      spacing={1}
      className={cn(track, className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(item, "min-w-0 rounded-chip px-2 data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:inset-ring data-[state=on]:inset-ring-border")}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SegmentedLinks({ links, label, className }: { links: { href: string; label: string; current: boolean }[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("flex items-center", track, className)}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.current ? "page" : undefined} className={cn(item, link.current && active)}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export { Segmented, SegmentedLinks };
