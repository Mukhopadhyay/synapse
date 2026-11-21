import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * shadcn Button restyled to the Synapse design system.
 * `signal` is reserved for the single ghost-note CTA; don't use it elsewhere. `solid` is the landing page's "Load graph".
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control text-ui whitespace-nowrap transition-colors duration-instant ease-standard disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon",
  {
    variants: {
      variant: {
        default:
          "border border-border-strong bg-surface-raised text-foreground hover:bg-surface",
        ghost:
          "text-muted-foreground hover:bg-surface-raised hover:text-foreground aria-pressed:bg-surface-raised aria-pressed:text-foreground",
        signal: "bg-primary text-primary-foreground",
        solid: "bg-foreground font-medium text-background hover:bg-foreground/85",
      },
      size: {
        default: "h-control px-3",
        icon: "size-control",
        lg: "h-10 gap-2 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
