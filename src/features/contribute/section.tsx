import { cn } from "@/lib/utils";

/** A Contribute page section: heading, optional intro and action, then content. */
export function ContributeSection({
  title,
  intro,
  action,
  children,
  className,
}: {
  title: string;
  intro?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-16", className)} aria-labelledby={`section-${title}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`section-${title}`} className="text-note-heading text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {intro && <p className="mt-2 text-ui font-normal text-muted-foreground">{intro}</p>}
      {children}
    </section>
  );
}

/** "Label →" in the page's link style; external links open in a new tab. */
export function ArrowLink({ href, children, external = false, className }: { href: string; children: React.ReactNode; external?: boolean; className?: string }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn("inline-flex items-center gap-1 rounded-chip text-ui-small text-foreground underline-offset-4 hover:underline", className)}
    >
      {children} <span aria-hidden>→</span>
    </a>
  );
}
