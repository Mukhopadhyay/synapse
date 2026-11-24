import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/features/theme/theme-toggle";

import { ContributeLink } from "./contribute-link";
import { DomainSwitcher, type DomainSummary } from "./domain-switcher";
import { GithubLink } from "./github-link";
import { MobileMenu } from "./mobile-menu";
import { SearchPill } from "./search-pill";
import { ViewSwitch } from "./view-switch";
import { Wordmark } from "./wordmark";

/**
 * The single floating bar over the canvas (never a page header). Left: wordmark and field switcher
 * (only once there's more than one field);
 * centre: the search pill, centred on the viewport; right: Map · List, Contribute, theme and GitHub. On phones: wordmark,
 * then search, theme and a menu sheet that holds the map's controls (`menu`), as 44px buttons.
 */
export function TopBar({ domains, menu }: { domains: DomainSummary[]; menu?: React.ReactNode }) {
  return (
    <header className="floating fixed inset-x-3 top-3 z-topbar flex h-topbar items-center pr-2 pl-4 sm:pl-5">
      <Wordmark />
      {domains.length > 1 && (
        <div className="hidden items-center sm:flex">
          <Separator orientation="vertical" className="mr-2 ml-4 bg-border-strong data-[orientation=vertical]:h-4" />
          <DomainSwitcher domains={domains} />
        </div>
      )}
      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end sm:gap-2 sm:pl-4">
        <SearchPill />
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {domains[0] && <ViewSwitch fallbackDomain={domains[0].id} className="mr-0.5" />}
          <ContributeLink />
        </div>
        <ThemeToggle className="max-sm:size-touch" />
        <div className="hidden sm:flex">
          <GithubLink />
        </div>
        <div className="sm:hidden">
          <MobileMenu
            nav={
              <>
                {domains[0] && <ViewSwitch fallbackDomain={domains[0].id} />}
                <ContributeLink />
              </>
            }
          >
            {menu}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
