import { Service } from '@angular/core';
import {
  RETURN_CONTRACT_VERSION,
  type ReturnAppsMessage,
  type ReturnDelivery,
} from './return-contract';

export type ReturnUrlValidation =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

/** Query/hash params appended when redirecting back to the caller. */
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

    // Reject javascript:, data:, and other non-http(s) schemes.
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

  /**
   * Parse `allowedOrigins` query value (comma-separated absolute origins).
   * Returns null when the param is absent/empty (no allowlist enforced).
   */
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

  parseDelivery(
    raw: string | null | undefined,
    fallback: ReturnDelivery = 'query',
  ): ReturnDelivery {
    if (raw === 'query' || raw === 'hash' || raw === 'postMessage') {
      return raw;
    }
    return fallback;
  }

  buildRedirectUrl(
    returnUrl: URL,
    params: ReturnRedirectParams,
    delivery: ReturnDelivery = 'query',
  ): string {
    if (delivery === 'hash') {
      return this.buildHashDeliveryUrl(returnUrl, params);
    }
    return this.buildQueryDeliveryUrl(returnUrl, params);
  }

  /**
   * Deliver success/error back to the caller via query, hash, or postMessage.
   * Falls back to hash redirect when postMessage has no opener/parent.
   */
  complete(
    returnUrl: URL,
    params: ReturnRedirectParams,
    delivery: ReturnDelivery = 'query',
  ): void {
    if (delivery === 'postMessage') {
      const message: ReturnAppsMessage = {
        source: 'return-apps',
        version: RETURN_CONTRACT_VERSION,
        ...params,
      };
      const targetOrigin = returnUrl.origin;
      try {
        if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
          window.opener.postMessage(message, targetOrigin);
          window.close();
          // If the browser blocks close, still navigate as fallback.
          location.href = this.buildRedirectUrl(returnUrl, params, 'hash');
          return;
        }
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage(message, targetOrigin);
          return;
        }
      } catch {
        // fall through to hash redirect
      }
      location.href = this.buildRedirectUrl(returnUrl, params, 'hash');
      return;
    }

    location.href = this.buildRedirectUrl(returnUrl, params, delivery);
  }

  private buildQueryDeliveryUrl(returnUrl: URL, params: ReturnRedirectParams): string {
    // Hash-based return URLs (e.g. https://host/app/#/demo-caller) must carry
    // query params in the hash, or Angular Router will not see them.
    if (returnUrl.hash.startsWith('#/')) {
      return this.mergeHashRouterParams(returnUrl, params);
    }

    const target = new URL(returnUrl.href);
    this.applyParams(target.searchParams, params);
    return target.toString();
  }

  private buildHashDeliveryUrl(returnUrl: URL, params: ReturnRedirectParams): string {
    // Hash-router callers already store route state in the hash — merge there.
    if (returnUrl.hash.startsWith('#/')) {
      return this.mergeHashRouterParams(returnUrl, params);
    }

    const search = new URLSearchParams();
    this.applyParams(search, params);
    const target = new URL(returnUrl.href);
    const qs = search.toString();
    target.hash = qs;
    return target.toString();
  }

  private mergeHashRouterParams(returnUrl: URL, params: ReturnRedirectParams): string {
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

  private applyParams(search: URLSearchParams, params: ReturnRedirectParams): void {
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === '') {
        continue;
      }
      search.set(key, value);
    }
  }
}
