import { RETURN_CONTRACT_VERSION, type ReturnDelivery } from './return-contract';

export type BuildOpenUrlOptions = {
  /** Absolute app base, e.g. https://return.purified.app/pin or http://localhost:4204 */
  baseUrl: string;
  returnUrl: string;
  state?: string;
  /** Comma-joined or array of allowed caller origins. */
  allowedOrigins?: string[] | string;
  delivery?: ReturnDelivery;
  /** Extra app-specific open params (length, mask, formats, …). */
  params?: Record<string, string | number | boolean | null | undefined>;
};

/** Build a helper-app open URL with contract v1 params. */
export function buildOpenUrl(options: BuildOpenUrlOptions): string {
  const url = new URL(options.baseUrl);
  url.searchParams.set('returnUrl', options.returnUrl);
  url.searchParams.set('v', String(RETURN_CONTRACT_VERSION));

  if (options.state != null && options.state !== '') {
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

/** Demo-caller helper: open this app and return to `/demo-caller` on the same origin. */
export function buildDemoOpenUrl(
  appBaseUrl: string,
  extras: {
    state?: string;
    delivery?: ReturnDelivery;
    params?: Record<string, string | number | boolean | null | undefined>;
  } = {},
): string {
  const returnUrl = `${appBaseUrl.replace(/\/$/, '')}/demo-caller`;
  let origin: string;
  try {
    origin = new URL(appBaseUrl).origin;
  } catch {
    origin = appBaseUrl;
  }
  return buildOpenUrl({
    baseUrl: appBaseUrl,
    returnUrl,
    state: extras.state ?? 'demo1',
    allowedOrigins: [origin],
    delivery: extras.delivery,
    params: extras.params,
  });
}
