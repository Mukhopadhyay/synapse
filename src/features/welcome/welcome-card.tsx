"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/features/keyboard/use-hotkey";
import { useSearchStore } from "@/features/search/search-store";
import type { DomainColor } from "@/lib/content/relations";
import { graphHref, isAllFieldsPath } from "@/lib/content/note-url";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useMapStore } from "@/lib/store/map-store";
import { usePrefsStore } from "@/lib/store/prefs-store";

export type FieldSummary = { id: string; name: string; color: DomainColor; description?: string; mostlyUnwritten: boolean };

/** Card width (384) plus its 12px inset: the map fits to the right of it. */
const CARD_INSET = 396;
/** The phone sheet's gap above the screen's bottom edge. */
const SHEET_GAP = 12;

function FieldRow({ field, onPick }: { field: FieldSummary; onPick: () => void }) {
  return (
    <Link
      href={graphHref(field.id)}
      onClick={onPick}
      className="flex items-center gap-3 rounded-control border border-border px-3 py-3 transition-colors duration-instant hover:border-border-strong hover:bg-surface-raised"
    >
      <span aria-hidden data-node-dot="" data-domain={field.color} className="inline-block size-2 shrink-0 self-start rounded-full mt-1.5" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-ui text-foreground">
          {field.name}
          {field.mostlyUnwritten && <Chip variant="outline">Mostly unwritten</Chip>}
        </span>
        {field.description && <span className="text-ui-small font-normal text-muted-foreground">{field.description}</span>}
      </span>
      <ArrowRight aria-hidden className="size-icon shrink-0 text-muted-foreground" />
    </Link>
  );
}

/**
 * First visit to the all-fields map: a card floating over the live map that says what Synapse is and offers each
 * field. Gone for good once closed, Esc'd, a field is picked or the map is moved. Never on note URLs.
 */
export function WelcomeCard({ fields }: { fields: FieldSummary[] }) {
  const onHome = isAllFieldsPath(usePathname());
  const breakpoint = useBreakpoint();
  const interacted = useMapStore((state) => state.interacted);
  const { restored, welcomeDismissed, set } = usePrefsStore();
  const visible = onHome && restored && !welcomeDismissed && !interacted;
  const dismiss = () => set({ welcomeDismissed: true });
  const cardRef = useRef<HTMLElement>(null);

  useHotkey("escape", () => {
    if (visible) dismiss();
  });

  useEffect(() => {
    if (onHome && interacted && restored && !welcomeDismissed) set({ welcomeDismissed: true });
  }, [onHome, interacted, restored, welcomeDismissed, set]);

  useEffect(() => {
    useMapStore.getState().setLeftInset(visible && breakpoint !== "mobile" ? CARD_INSET : 0);
    return () => useMapStore.getState().setLeftInset(0);
  }, [visible, breakpoint]);

  useEffect(() => {
    const card = cardRef.current;
    const { setBottomInset } = useMapStore.getState();
    if (!visible || breakpoint !== "mobile" || !card) return setBottomInset(0);
    const observer = new ResizeObserver(() => setBottomInset(Math.round(card.getBoundingClientRect().height) + SHEET_GAP));
    observer.observe(card);
    return () => {
      observer.disconnect();
      setBottomInset(0);
    };
  }, [visible, breakpoint]);

  if (!visible) return null;

  return (
    <section
      ref={cardRef}
      aria-labelledby="welcome-title"
      className="floating absolute top-17 left-3 z-overlay flex w-96 flex-col px-6 pt-6 pb-3 animate-in fade-in-0 duration-quick max-sm:top-auto max-sm:right-3 max-sm:bottom-3 max-sm:w-auto max-sm:max-h-[45dvh] max-sm:overflow-y-auto max-sm:px-4 max-sm:pt-3 max-sm:pb-1"
    >
      <div className="flex items-start justify-between">
        <p className="text-overline text-faint uppercase">Welcome</p>
        <Button variant="ghost" size="icon" aria-label="Close welcome" onClick={dismiss} className="absolute top-5 right-4 max-sm:top-3 max-sm:right-3">
          <X aria-hidden />
        </Button>
      </div>
      <h1 id="welcome-title" className="mt-2 font-serif text-note-title text-balance text-foreground max-sm:mt-1 max-sm:pr-8 max-sm:text-note-heading">
        A map of how ideas connect
      </h1>
      <p className="mt-6 text-note-summary text-muted-foreground max-sm:hidden">
        Every dot is a short note and every line says how two ideas relate. Start with a field, or just wander — the map keeps your place.
      </p>
      <nav aria-label="Fields" className="mt-6 flex flex-col gap-2 max-sm:mt-3">
        {fields.map((field) => (
          <FieldRow key={field.id} field={field} onPick={dismiss} />
        ))}
      </nav>
      <div className="mt-6 flex h-12 items-center justify-between border-t border-border max-sm:mt-3 max-sm:h-11">
        <button
          type="button"
          onClick={() => useSearchStore.getState().setOpen(true)}
          className="flex items-center gap-2 rounded-chip text-ui-small font-normal text-faint transition-colors duration-instant hover:text-muted-foreground pointer-coarse:invisible"
        >
          Search anytime <Kbd>⌘K</Kbd>
        </button>
        <Link href="/contribute" className="flex items-center gap-1 rounded-chip text-ui-small text-foreground">
          Write a note <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
