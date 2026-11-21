"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

/**
 * shadcn Drawer (Vaul) restyled to the Synapse design system. Unlike shadcn's version, the
 * content doesn't bring its own overlay: the map must stay usable above a non-modal sheet.
 */
function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "floating fixed inset-x-0 bottom-0 z-panel flex flex-col rounded-b-none border-b-0 outline-none",
          className,
        )}
        {...props}
      >
        <DrawerPrimitive.Handle className="mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-border-strong" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={className} {...props} />;
}

export { Drawer, DrawerContent, DrawerTitle };
