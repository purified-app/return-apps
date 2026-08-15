import type { ParamMap } from '@angular/router';
import type { ReturnDelivery } from './return-contract';
import {
  ReturnUrlValidator,
  type ReturnRedirectParams,
} from './return-url.validator';

export type ReturnSessionInit =
  | { ok: true; session: ReturnSession }
  | { ok: false; reason: string; session: ReturnSession };

/**
 * Per-page returnUrl session: parse inbound params, then succeed/cancel/fail.
 * Not an injectable singleton — construct via `ReturnSession.open(...)`.
 */
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
      return {
        ok: true,
        session: new ReturnSession(validator, null, state, delivery),
      };
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
    this.validator.complete(
      this.returnUrl,
      { error, state: this.state },
      this.delivery === 'postMessage' ? 'postMessage' : this.delivery,
    );
    return true;
  }

  cancel(): boolean {
    return this.fail('cancelled');
  }
}
