// Matches a request Origin against an allow-list. Each allowed entry is either
// an exact origin ("https://app.example.com") or a single-level wildcard
// pattern ("https://*.vercel.app") where "*" stands in for one subdomain label.
export function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  for (const entry of allowed) {
    if (entry === origin) return true;
    if (entry.includes('*')) {
      // Escape regex metachars, then turn '*' into a "one label" matcher
      // ([^.]+) so "https://*.vercel.app" does NOT match "https://a.b.vercel.app".
      const pattern =
        '^' +
        entry
          .split('*')
          .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('[^.]+') +
        '$';
      if (new RegExp(pattern).test(origin)) return true;
    }
  }
  return false;
}
