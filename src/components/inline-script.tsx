/**
 * Runs a script synchronously during HTML parsing, before first paint.
 * Pattern from Next's "preventing flash before hydration" guide: the type flips
 * on the client so React doesn't warn about rendering a <script>.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
