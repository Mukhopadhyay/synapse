function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/** The closest candidate within 1 edit (short words) or 2 edits, if any. */
export function didYouMean(input: string, candidates: Iterable<string>): string | undefined {
  const limit = input.length <= 4 ? 1 : 2;
  let best: { candidate: string; distance: number } | undefined;
  for (const candidate of candidates) {
    if (candidate === input) continue;
    const distance = editDistance(input, candidate);
    if (distance <= limit && (!best || distance < best.distance)) best = { candidate, distance };
  }
  return best?.candidate;
}
