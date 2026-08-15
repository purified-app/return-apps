import type { ParamMap } from '@angular/router';
import type { ReturnDelivery } from './return-url.validator';

export const RETURN_CONTRACT_VERSION = 1;

export type ReturnResult = {
  value: string | null;
  format: string | null;
  error: string | null;
  state: string | null;
  extras: Record<string, string>;
};

/** Build a helper-app open URL (contract v1). */
export function buildOpenUrl(options: {
  baseUrl: string;
  returnUrl: string;
  state?: string;
  allowedOrigins?: string[] | string;
  delivery?: ReturnDelivery;
  params?: Record<string, string | number | boolean | null | undefined>;
}): string {
  const url = new URL(options.baseUrl);
  url.searchParams.set('returnUrl', options.returnUrl);
  if (options.state) {
    url.searchParams.set('state', options.state);
  }
  if (options.allowedOrigins != null) {
    const list = Array.isArray(options.allowedOrigins)
      ? options.allowedOrigins
      : options.allowedOrigins.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) {
      url.searchParams.set('allowedOrigins', list.join(','));
    }
  }
  if (options.delivery) {
    url.searchParams.set('delivery', options.delivery);
  }
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value == null || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Open this app and return to `/demo-caller` on the same origin. */
export function buildDemoOpenUrl(
  appBaseUrl: string,
  extras: {
    delivery?: ReturnDelivery;
    params?: Record<string, string | number | boolean | null | undefined>;
  } = {},
): string {
  const base = appBaseUrl.replace(/\/$/, '');
  let origin = base;
  try {
    origin = new URL(appBaseUrl).origin;
  } catch {
    /* keep base */
  }
  return buildOpenUrl({
    baseUrl: appBaseUrl,
    returnUrl: `${base}/demo-caller`,
    state: 'demo1',
    allowedOrigins: [origin],
    delivery: extras.delivery,
    params: extras.params,
  });
}

/** Read contract result from query and/or hash. */
export function readReturnParams(
  queryParamMap: ParamMap,
  hash: string = typeof location !== 'undefined' ? location.hash : '',
): ReturnResult {
  const merged: Record<string, string> = {};
  if (hash && hash !== '#') {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    const qIndex = raw.indexOf('?');
    const query = qIndex >= 0 ? raw.slice(qIndex + 1) : raw.startsWith('/') ? '' : raw;
    if (query) {
      for (const [k, v] of new URLSearchParams(query)) {
        if (v) {
          merged[k] = v;
        }
      }
    }
  }
  for (const key of queryParamMap.keys) {
    const value = queryParamMap.get(key);
    if (value) {
      merged[key] = value;
    }
  }

  const extras: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (key !== 'value' && key !== 'format' && key !== 'error' && key !== 'state') {
      extras[key] = value;
    }
  }

  return {
    value: merged['value'] ?? null,
    format: merged['format'] ?? null,
    error: merged['error'] ?? null,
    state: merged['state'] ?? null,
    extras,
  };
}
