/**
 * Lightweight return-apps caller SDK (contract v1).
 * Pure ESM — no framework dependency.
 *
 * Usage:
 *   import { openReturnApp, parseReturnResult } from './return-apps.mjs';
 *   location.href = openReturnApp('pin', { returnUrl, state: 'x', allowedOrigins: [location.origin] });
 */

export const CONTRACT_VERSION = 1;

export const DEFAULT_BASE_URL = 'https://return.purified.app';

/** @typedef {'sign'|'scan'|'geo'|'map'|'pin'|'nfc'|'color'} ReturnAppId */
/** @typedef {'query'|'hash'|'postMessage'} ReturnDelivery */

/** @type {Record<string, ReturnDelivery>} */
export const DEFAULT_DELIVERY = {
  sign: 'hash',
  pin: 'hash',
  scan: 'query',
  geo: 'query',
  map: 'query',
  nfc: 'postMessage',
  color: 'query',
};

/**
 * @param {ReturnAppId} app
 * @param {{
 *   returnUrl: string,
 *   state?: string,
 *   allowedOrigins?: string[]|string,
 *   delivery?: ReturnDelivery,
 *   baseUrl?: string,
 *   params?: Record<string, string|number|boolean|null|undefined>,
 * }} options
 * @returns {string}
 */
export function openReturnApp(app, options) {
  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = new URL(`${base}/${app}/`);
  url.searchParams.set('returnUrl', options.returnUrl);
  url.searchParams.set('v', String(CONTRACT_VERSION));

  if (options.state) {
    url.searchParams.set('state', options.state);
  }

  const origins = normalizeOrigins(options.allowedOrigins);
  if (origins.length > 0) {
    url.searchParams.set('allowedOrigins', origins.join(','));
  }

  const delivery = options.delivery ?? DEFAULT_DELIVERY[app] ?? 'query';
  url.searchParams.set('delivery', delivery);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Parse a return result from the current location (query + hash) or a URL string.
 * @param {string|URL|Location} [input]
 */
export function parseReturnResult(input = typeof location !== 'undefined' ? location : '') {
  const url =
    typeof input === 'string'
      ? new URL(input, 'http://localhost')
      : input instanceof URL
        ? input
        : new URL(input.href);

  const merged = {
    ...paramsFromHash(url.hash),
    ...Object.fromEntries(url.searchParams.entries()),
  };

  const extras = { ...merged };
  delete extras.value;
  delete extras.format;
  delete extras.error;
  delete extras.state;

  return {
    value: merged.value ?? null,
    format: merged.format ?? null,
    error: merged.error ?? null,
    state: merged.state ?? null,
    extras,
  };
}

/**
 * Listen for delivery=postMessage results from a helper opened via window.open.
 * @param {(result: ReturnType<typeof parseReturnResult> & { raw: MessageEvent }) => void} onResult
 * @param {{ allowedOrigins?: string[] }} [options]
 * @returns {() => void} unsubscribe
 */
export function listenForReturnMessage(onResult, options = {}) {
  const allowed = new Set((options.allowedOrigins ?? []).map((o) => o.replace(/\/$/, '')));

  /** @param {MessageEvent} event */
  const handler = (event) => {
    const data = event.data;
    if (!data || data.source !== 'return-apps' || data.version !== CONTRACT_VERSION) {
      return;
    }
    if (allowed.size > 0 && !allowed.has(event.origin)) {
      return;
    }
    onResult({
      value: data.value ?? null,
      format: data.format ?? null,
      error: data.error ?? null,
      state: data.state ?? null,
      extras: Object.fromEntries(
        Object.entries(data).filter(
          ([k]) => !['source', 'version', 'value', 'format', 'error', 'state'].includes(k),
        ),
      ),
      raw: event,
    });
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

/** @param {string[]|string|undefined} value */
function normalizeOrigins(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.split(',');
  return list
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try {
        return new URL(s).origin;
      } catch {
        return s.replace(/\/$/, '');
      }
    });
}

/** @param {string} hash */
function paramsFromHash(hash) {
  if (!hash || hash === '#') return {};
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = raw.indexOf('?');
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : raw.startsWith('/') ? '' : raw;
  if (!query) return {};
  return Object.fromEntries(new URLSearchParams(query).entries());
}
