import * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center rounded-chip px-1 font-mono text-kbd text-muted-foreground inset-ring inset-ring-border-strong",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
