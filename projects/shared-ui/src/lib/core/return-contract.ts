/** Shared return-apps integration contract (breaking OK for prototypes). */
export const RETURN_CONTRACT_VERSION = 1;

/** How the helper delivers the result back to the caller. */
export type ReturnDelivery = 'query' | 'hash' | 'postMessage';

/** Canonical format tags returned in the `format` query/hash param. */
export type ReturnFormat =
  | 'sign.svg'
  | 'geo.point'
  | 'map.point'
  | 'pin.digits'
  | 'color.hex'
  | `scan.${string}`
  | `nfc.${string}`;

/** Standard error codes for failed/cancelled returns. */
export type ReturnErrorCode =
  | 'cancelled'
  | 'denied'
  | 'unsupported'
  | 'timeout'
  | 'too_large'
  | 'failed';

/** Known app slugs (public URL segments). */
export type ReturnAppId =
  | 'sign'
  | 'scan'
  | 'geo'
  | 'map'
  | 'pin'
  | 'nfc'
  | 'color';

/** Apps that default to hash delivery (keeps sensitive payloads out of query/Referer). */
export const SENSITIVE_APPS: ReadonlySet<ReturnAppId> = new Set(['sign', 'pin']);

export const DEFAULT_DELIVERY_BY_APP: Record<ReturnAppId, ReturnDelivery> = {
  sign: 'hash',
  pin: 'hash',
  scan: 'query',
  geo: 'query',
  map: 'query',
  nfc: 'postMessage',
  color: 'query',
};

/** postMessage payload shape when delivery=postMessage. */
export type ReturnAppsMessage = {
  source: 'return-apps';
  version: typeof RETURN_CONTRACT_VERSION;
  value?: string;
  format?: string;
  error?: string;
  state?: string | null;
  [key: string]: string | null | undefined | number;
};

export function scanFormat(barcodeFormat: string): `scan.${string}` {
  const normalized = barcodeFormat.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `scan.${normalized || 'unknown'}`;
}

export function nfcFormat(recordType: string): `nfc.${string}` {
  const normalized = recordType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `nfc.${normalized || 'unknown'}`;
}
