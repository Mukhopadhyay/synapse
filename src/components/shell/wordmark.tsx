import Link from "next/link";
import { GitFork } from "lucide-react";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-chip text-ui font-semibold text-foreground"
    >
      <GitFork aria-hidden className="size-3.5" />
      Synapse
    </Link>
  );
}
