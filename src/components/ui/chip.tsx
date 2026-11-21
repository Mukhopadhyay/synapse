import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** 24px label for levels, counts and tags. Never drawn on map nodes. */
const chipVariants = cva(
  "inline-flex h-chip items-center gap-1 rounded-chip px-2 text-ui-small whitespace-nowrap tabular-nums [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-surface-raised text-foreground",
        outline: "text-muted-foreground inset-ring inset-ring-border-strong",
        /** Something that doesn't exist yet: a dashed outline, like a ghost node's ring. */
        dashed: "text-faint border border-dashed border-border-strong",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Chip({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return <span data-slot="chip" className={cn(chipVariants({ variant, className }))} {...props} />;
}

export { Chip };
