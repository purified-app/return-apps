export async function reverseGeocode(
  lat: number,
  lng: number,
  options: { timeoutMs?: number; lang?: string } = {},
): Promise<string | null> {
  const timeoutMs = options.timeoutMs ?? 2500;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'jsonv2');
    if (options.lang) {
      url.searchParams.set('accept-language', options.lang);
    }
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { display_name?: unknown };
    return typeof data.display_name === 'string' && data.display_name.trim()
      ? data.display_name.trim()
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
