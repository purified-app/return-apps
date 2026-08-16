export const CONTRACT_VERSION: 1;
export const DEFAULT_BASE_URL: 'https://return.purified.app';

export type ReturnAppId =
  | 'sign'
  | 'scan'
  | 'geo'
  | 'map'
  | 'pin'
  | 'nfc'
  | 'color'
  | 'level'
  | 'compass'
  | 'qr';

export type ReturnAppName = ReturnAppId | 'orient';
export type ReturnDelivery = 'query' | 'hash';

export interface OpenReturnAppOptions {
  returnUrl: string;
  baseUrl?: string;
  state?: string;
  allowedOrigins?: string | readonly string[];
  delivery?: ReturnDelivery;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export interface ReturnResult {
  value: string | null;
  format: string | null;
  error: string | null;
  state: string | null;
  extras: Record<string, string>;
}

export function openReturnApp(app: ReturnAppName, options: OpenReturnAppOptions): string;

export function parseReturnResult(input?: string | URL | Location): ReturnResult;
