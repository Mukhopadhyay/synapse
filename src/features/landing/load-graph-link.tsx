"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ALL_FIELDS_HREF } from "@/lib/content/note-url";

/** "Load graph": prefetches the map route on hover or focus rather than on sight, so the landing page stays light. */
export function LoadGraphLink({ size = "default", arrow = false, className }: { size?: "default" | "lg"; arrow?: boolean; className?: string }) {
  const router = useRouter();
  const warm = () => router.prefetch(ALL_FIELDS_HREF);
  return (
    <Button asChild variant="solid" size={size} className={className}>
      <Link href={ALL_FIELDS_HREF} prefetch={false} onPointerEnter={warm} onFocus={warm}>
        Load graph
        {arrow && <ArrowRight aria-hidden />}
      </Link>
    </Button>
  );
}
