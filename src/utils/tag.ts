// Canonicalizes a tag name so variants collapse to one tag:
// trims, lowercases, and squashes internal whitespace.
// "  React JS " and "react   js" both become "react js".
export function normalizeTag(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Normalize a list, dropping empties and duplicates (order preserved).
export function normalizeTags(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = normalizeTag(raw);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
