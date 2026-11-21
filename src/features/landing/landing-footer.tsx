export function LandingFooter({ repo }: { repo: string }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 pb-16 sm:-mx-6 sm:px-6">
      <p className="text-ui-small font-normal text-faint">Synapse</p>
      <p className="font-mono text-meta text-faint">
        Code MIT · Notes CC BY-SA 4.0 ·{" "}
        <a href={repo} target="_blank" rel="noreferrer" className="rounded-chip text-foreground transition-colors duration-instant hover:text-muted-foreground">
          GitHub
        </a>
      </p>
    </footer>
  );
}
