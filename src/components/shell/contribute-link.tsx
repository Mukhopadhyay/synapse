"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isDocumentPath } from "@/lib/content/note-url";
import { cn } from "@/lib/utils";

/** "Contribute" in the bar; filled while you're on the page. */
export function ContributeLink({ className, prefetch }: { className?: string; prefetch?: boolean }) {
  const current = isDocumentPath(usePathname());
  return (
    <Link
      href="/contribute"
      prefetch={prefetch}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-8 items-center rounded-control px-3 text-ui transition-colors duration-instant hover:text-foreground",
        current ? "bg-surface-raised text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      Contribute
    </Link>
  );
}
