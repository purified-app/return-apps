/**
 * return-apps caller SDK (contract v1).
 *
 * Docs: https://github.com/purified-app/return-apps/blob/main/docs/integration.md
 * Catalog: https://return.purified.app/apps.json
 * Agent index: https://return.purified.app/llms.txt
 *
 *   import { openReturnApp, parseReturnResult } from './return-apps.mjs';
 *
 * Pin/sign default to delivery=hash — always use parseReturnResult (not search alone).
 */
export const CONTRACT_VERSION = 1;
export const DEFAULT_BASE_URL = 'https://return.purified.app';

const APPS = new Set(['sign', 'scan', 'geo', 'map', 'pin', 'nfc', 'color', 'level']);
/** @type {Record<string, string>} */
const APP_ALIASES = { orient: 'level' };

/**
 * @param {'sign'|'scan'|'geo'|'map'|'pin'|'nfc'|'color'|'level'|'orient'} app
 */
export function openReturnApp(app, options) {
  const id = APP_ALIASES[app] ?? app;
  if (!APPS.has(id)) {
    throw new Error(`Unknown return app: ${app}`);
  }
  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = new URL(`${base}/${id}/`);
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
    options.delivery ?? (id === 'pin' || id === 'sign' ? 'hash' : 'query');
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
