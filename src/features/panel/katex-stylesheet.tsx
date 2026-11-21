/**
 * KaTeX's CSS, only on notes with math. React 19 hoists a `precedence` stylesheet into <head>,
 * dedupes it, and holds client navigation until it loads, so math never flashes unstyled.
 */
export function KatexStylesheet() {
  // eslint-disable-next-line @next/next/no-css-tags -- the rule predates React 19 stylesheet precedence
  return <link rel="stylesheet" href="/vendor/katex/katex.min.css" precedence="default" />;
}
