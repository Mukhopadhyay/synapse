"use client";

import { useId } from "react";
import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** A collapsible group of settings with an overline heading. */
export function SettingsSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t border-border first:border-t-0">
      <CollapsibleTrigger className="group flex h-9 w-full items-center gap-1.5 px-3 text-overline text-faint uppercase transition-colors duration-instant hover:text-muted-foreground">
        <ChevronRight aria-hidden className="size-3.5 transition-transform duration-quick group-data-[state=open]:rotate-90" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 px-3 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** A collapsed group inside a section, for settings most people never need. */
export function SettingsSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible className="-mx-1 mt-1">
      <CollapsibleTrigger className="group flex h-7 w-full items-center gap-1.5 rounded-control px-1 text-ui-small font-normal text-faint transition-colors duration-instant hover:text-muted-foreground">
        <ChevronRight aria-hidden className="size-3.5 transition-transform duration-quick group-data-[state=open]:rotate-90" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 px-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Label on the left, a switch on the right; `sample` is an optional icon or line before the label. */
export function SwitchRow({ label, checked, onChange, sample }: { label: string; checked: boolean; onChange: (checked: boolean) => void; sample?: React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex h-7 items-center gap-2">
      {sample}
      <label htmlFor={id} className={cn("flex-1 truncate text-ui-small font-normal", checked ? "text-muted-foreground" : "text-faint")}>
        {label}
      </label>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** A labelled slider that applies while it's dragged, with its value in tabular figures and an optional one-line explanation. */
export function SliderRow({
  label,
  description,
  value,
  range,
  format = (next) => String(next),
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  range: { min: number; max: number; step: number };
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const descriptionId = useId();
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-between">
        <label id={id} className="text-ui-small font-normal text-muted-foreground">{label}</label>
        <span className="text-ui-small font-normal text-faint tabular-nums">{format(value)}</span>
      </div>
      <Slider
        aria-labelledby={id}
        aria-describedby={description ? descriptionId : undefined}
        min={range.min}
        max={range.max}
        step={range.step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      />
      {description && (
        <p id={descriptionId} className="text-ui-small font-normal text-faint">
          {description}
        </p>
      )}
    </div>
  );
}
