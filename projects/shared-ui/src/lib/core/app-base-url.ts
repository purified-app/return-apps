/** Absolute origin+path for this deployment (no trailing slash). */
export function appBaseUrl(): string {
  const baseHref = document.querySelector('base')?.href ?? `${location.origin}/`;
  return baseHref.replace(/\/$/, '');
}
