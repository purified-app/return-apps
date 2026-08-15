import { Service } from '@angular/core';

export type ReturnDelivery = 'query' | 'hash';

export type ReturnUrlValidation =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

/** Params appended when redirecting back to the caller. */
export type ReturnRedirectParams = {
  value?: string;
  error?: string;
  state?: string | null;
  format?: string;
  [key: string]: string | null | undefined;
};

export type ValidateReturnUrlOptions = {
  /** When non-empty, `returnUrl` origin must match one of these origins. */
  allowedOrigins?: string[] | null;
};

@Service()
export class ReturnUrlValidator {
  validate(
    returnUrl: string | null | undefined,
    options: ValidateReturnUrlOptions = {},
  ): ReturnUrlValidation {
    if (!returnUrl?.trim()) {
      return { ok: false, reason: 'Missing returnUrl.' };
    }

    let url: URL;
    try {
      url = new URL(returnUrl);
    } catch {
      return { ok: false, reason: 'returnUrl is invalid.' };
    }

    const isLocalHttp =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '[::1]' ||
        url.hostname === '::1');

    if (url.protocol !== 'https:' && !isLocalHttp) {
      return {
        ok: false,
        reason:
          'Only https URLs are allowed (plus http://localhost / 127.0.0.1 / ::1 for local development).',
      };
    }

    const allowed = options.allowedOrigins?.filter(Boolean) ?? [];
    if (allowed.length > 0) {
      const origin = url.origin.toLowerCase();
      const ok = allowed.some((entry) => {
        try {
          return new URL(entry).origin.toLowerCase() === origin;
        } catch {
          return entry.replace(/\/$/, '').toLowerCase() === origin;
        }
      });
      if (!ok) {
        return {
          ok: false,
          reason: `returnUrl origin is not in allowedOrigins (${allowed.join(', ')}).`,
        };
      }
    }

    return { ok: true, url };
  }

  parseAllowedOrigins(raw: string | null | undefined): string[] | null {
    if (!raw?.trim()) {
      return null;
    }
    const origins = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        try {
          return new URL(part).origin;
        } catch {
          return null;
        }
      })
      .filter((origin): origin is string => origin != null);
    return origins.length > 0 ? origins : null;
  }

  parseDelivery(raw: string | null | undefined, fallback: ReturnDelivery = 'query'): ReturnDelivery {
    return raw === 'hash' || raw === 'query' ? raw : fallback;
  }

  buildRedirectUrl(
    returnUrl: URL,
    params: ReturnRedirectParams,
    delivery: ReturnDelivery = 'query',
  ): string {
    if (delivery === 'hash' && !returnUrl.hash.startsWith('#/')) {
      const search = new URLSearchParams();
      this.applyParams(search, params);
      const target = new URL(returnUrl.href);
      target.hash = search.toString();
      return target.toString();
    }

    // Query delivery, or hash-router return URLs (`#/path`) — put params in the hash query.
    if (returnUrl.hash.startsWith('#/')) {
      const hashWithoutSharp = returnUrl.hash.slice(1);
      const qIndex = hashWithoutSharp.indexOf('?');
      const hashPath =
        qIndex >= 0 ? hashWithoutSharp.slice(0, qIndex) : hashWithoutSharp;
      const existingQuery = qIndex >= 0 ? hashWithoutSharp.slice(qIndex + 1) : '';
      const search = new URLSearchParams(existingQuery);
      this.applyParams(search, params);
      const qs = search.toString();
      return `${returnUrl.origin}${returnUrl.pathname}${returnUrl.search}#${hashPath}${
        qs ? `?${qs}` : ''
      }`;
    }

    const target = new URL(returnUrl.href);
    this.applyParams(target.searchParams, params);
    return target.toString();
  }

  private applyParams(search: URLSearchParams, params: ReturnRedirectParams): void {
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === '') {
        continue;
      }
      search.set(key, value);
    }
  }
}
