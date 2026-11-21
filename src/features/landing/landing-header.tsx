import { ContributeLink } from "@/components/shell/contribute-link";
import { GithubLink } from "@/components/shell/github-link";
import { Wordmark } from "@/components/shell/wordmark";
import { ThemeToggle } from "@/features/theme/theme-toggle";

import { LoadGraphLink } from "./load-graph-link";

export function LandingHeader() {
  return (
    <header className="flex h-16 items-center justify-between gap-4">
      <Wordmark />
      <nav aria-label="Site" className="flex items-center gap-1">
        <a
          href="#the-idea"
          className="flex h-8 items-center rounded-control px-3 text-ui text-muted-foreground transition-colors duration-instant hover:text-foreground max-sm:hidden"
        >
          How it works
        </a>
        <ContributeLink prefetch={false} className="max-sm:hidden" />
        <GithubLink />
        <ThemeToggle />
        <LoadGraphLink className="ml-2" />
      </nav>
    </header>
  );
}
