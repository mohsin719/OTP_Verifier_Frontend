/** Normalize pathname for nav matching (Next.js trailingSlash). */
export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function isNavActive(pathname: string, href: string): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (current === target) return true;

  // Section roots only match their exact URL (not child routes).
  const exactOnly = new Set(["/dashboard", "/manage"]);
  if (exactOnly.has(target)) return false;

  return current.startsWith(`${target}/`);
}
