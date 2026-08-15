/**
 * Lightweight return-apps caller SDK (contract v1).
 *
 *   import { openReturnApp, parseReturnResult } from './return-apps.mjs';
 */
export const CONTRACT_VERSION = 1;
export const DEFAULT_BASE_URL = 'https://return.purified.app';

/** @param {'sign'|'scan'|'geo'|'map'|'pin'|'nfc'|'color'} app */
export function openReturnApp(app, options) {
  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = new URL(`${base}/${app}/`);
  url.searchParams.set('returnUrl', options.returnUrl);
  url.searchParams.set('v', String(CONTRACT_VERSION));
  if (options.state) url.searchParams.set('state', options.state);

  const origins = [].concat(options.allowedOrigins ?? []).flatMap((v) =>
    String(v)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (origins.length) url.searchParams.set('allowedOrigins', origins.join(','));

  const delivery =
    options.delivery ?? (app === 'pin' || app === 'sign' ? 'hash' : 'query');
  url.searchParams.set('delivery', delivery);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value != null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Parse result from location / URL (query + hash). */
export function parseReturnResult(input = location) {
  const url =
    typeof input === 'string'
      ? new URL(input, 'http://localhost')
      : input instanceof URL
        ? input
        : new URL(input.href);

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashQuery = hash.includes('?')
    ? hash.slice(hash.indexOf('?') + 1)
    : hash.startsWith('/')
      ? ''
      : hash;
  const merged = {
    ...Object.fromEntries(new URLSearchParams(hashQuery)),
    ...Object.fromEntries(url.searchParams),
  };
  const { value = null, format = null, error = null, state = null, ...extras } = merged;
  return { value, format, error, state, extras };
}
