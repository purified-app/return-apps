import type { ParamMap } from '@angular/router';

/** Normalized result read from a caller URL (query and/or hash). */
export type ReturnResult = {
  value: string | null;
  format: string | null;
  error: string | null;
  state: string | null;
  /** Extra params (lat, lng, rgb, recordType, …) excluding the core four. */
  extras: Record<string, string>;
};

const CORE_KEYS = new Set(['value', 'format', 'error', 'state']);

/**
 * Read return-apps result params from Angular query params and/or the location hash.
 * Supports delivery=query, delivery=hash (`#value=…`), and hash-router (`#/path?value=…`).
 */
export function parseReturnResult(
  queryParamMap: ParamMap,
  hash: string = typeof location !== 'undefined' ? location.hash : '',
): ReturnResult {
  const fromQuery = paramMapToRecord(queryParamMap);
  const fromHash = parseHashParams(hash);
  const merged = { ...fromHash, ...fromQuery };

  const extras: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (!CORE_KEYS.has(key)) {
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

function paramMapToRecord(params: ParamMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of params.keys) {
    const value = params.get(key);
    if (value != null && value !== '') {
      out[key] = value;
    }
  }
  return out;
}

function parseHashParams(hash: string): Record<string, string> {
  if (!hash || hash === '#') {
    return {};
  }
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  // Hash router: #/path?a=1 or plain fragment: a=1&b=2
  const qIndex = raw.indexOf('?');
  const query =
    qIndex >= 0 ? raw.slice(qIndex + 1) : raw.startsWith('/') ? '' : raw;
  if (!query) {
    return {};
  }
  const out: Record<string, string> = {};
  const search = new URLSearchParams(query);
  for (const [key, value] of search.entries()) {
    if (value !== '') {
      out[key] = value;
    }
  }
  return out;
}
