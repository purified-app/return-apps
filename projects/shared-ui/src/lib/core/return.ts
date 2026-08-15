import type { ParamMap } from '@angular/router';
import {
  ReturnUrlValidator,
  type ReturnDelivery,
  type ReturnRedirectParams,
} from './return-url.validator';

export const RETURN_CONTRACT_VERSION = 1;

export type { ReturnDelivery };

export type ReturnResult = {
  value: string | null;
  format: string | null;
  error: string | null;
  state: string | null;
  extras: Record<string, string>;
};

export type ReturnSessionInit =
  | { ok: true; session: ReturnSession }
  | { ok: false; reason: string; session: ReturnSession };

/** Normalize barcode/NFC type tags: `QR_CODE` → `scan.qr_code`. */
export function taggedFormat(prefix: 'scan' | 'nfc', raw: string): string {
  const normalized = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `${prefix}.${normalized || 'unknown'}`;
}

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
  url.searchParams.set('v', String(RETURN_CONTRACT_VERSION));
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

/** Read result from query params and/or location hash. */
export function parseReturnResult(
  queryParamMap: ParamMap,
  hash: string = typeof location !== 'undefined' ? location.hash : '',
): ReturnResult {
  const merged = { ...hashParams(hash), ...paramMapRecord(queryParamMap) };
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

/** Per-page returnUrl session (not a singleton). */
export class ReturnSession {
  private constructor(
    private readonly validator: ReturnUrlValidator,
    readonly returnUrl: URL | null,
    readonly state: string | null,
    readonly delivery: ReturnDelivery,
  ) {}

  get isReturnMode(): boolean {
    return this.returnUrl != null;
  }

  static open(
    validator: ReturnUrlValidator,
    params: ParamMap,
    defaults: { delivery?: ReturnDelivery } = {},
  ): ReturnSessionInit {
    const state = params.get('state');
    const delivery = validator.parseDelivery(params.get('delivery'), defaults.delivery ?? 'query');
    const allowedOrigins = validator.parseAllowedOrigins(params.get('allowedOrigins'));
    const rawReturnUrl = params.get('returnUrl');

    if (!rawReturnUrl) {
      return { ok: true, session: new ReturnSession(validator, null, state, delivery) };
    }

    const validation = validator.validate(rawReturnUrl, { allowedOrigins });
    if (!validation.ok) {
      return {
        ok: false,
        reason: validation.reason,
        session: new ReturnSession(validator, null, state, delivery),
      };
    }

    return {
      ok: true,
      session: new ReturnSession(validator, validation.url, state, delivery),
    };
  }

  succeed(
    value: string,
    format: string,
    extras: Omit<ReturnRedirectParams, 'value' | 'format' | 'state' | 'error'> = {},
  ): boolean {
    if (!this.returnUrl) {
      return false;
    }
    this.validator.complete(
      this.returnUrl,
      { value, format, state: this.state, ...extras },
      this.delivery,
    );
    return true;
  }

  fail(error: string): boolean {
    if (!this.returnUrl) {
      return false;
    }
    this.validator.complete(this.returnUrl, { error, state: this.state }, this.delivery);
    return true;
  }

  cancel(): boolean {
    return this.fail('cancelled');
  }
}

function paramMapRecord(params: ParamMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of params.keys) {
    const value = params.get(key);
    if (value) {
      out[key] = value;
    }
  }
  return out;
}

function hashParams(hash: string): Record<string, string> {
  if (!hash || hash === '#') {
    return {};
  }
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = raw.indexOf('?');
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : raw.startsWith('/') ? '' : raw;
  if (!query) {
    return {};
  }
  return Object.fromEntries(
    [...new URLSearchParams(query).entries()].filter(([, v]) => v !== ''),
  );
}
