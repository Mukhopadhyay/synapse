"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

/** A labelled block in the menu sheet. */
export function MenuSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-border px-4 py-4 first:border-t-0">
      <div className="flex items-center justify-between">
        <h2 className="text-overline text-faint uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Phones only: one sheet holding the views, Contribute and whatever map controls the shell passes in (legend, filters, settings). The theme switch sits in the bar. */
export function MobileMenu({ nav, children }: { nav?: React.ReactNode; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)} className="size-touch">
        <Menu aria-hidden />
      </Button>
      <DrawerContent className="max-h-[85dvh]">
        <div className="flex h-13 items-center px-4 pt-2 pb-3">
          <DrawerTitle className="text-ui text-foreground">Map settings</DrawerTitle>
        </div>
        {nav && (
          <div
            className="flex items-center gap-2 px-4 pb-3"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {nav}
          </div>
        )}
        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto border-t border-border pb-[env(safe-area-inset-bottom)]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
