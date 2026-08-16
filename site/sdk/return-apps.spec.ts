import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION, openReturnApp, parseReturnResult } from './return-apps.mjs';

describe('return-apps SDK', () => {
  it('opens known apps with contract params', () => {
    const url = new URL(
      openReturnApp('pin', {
        returnUrl: 'https://app.example/cb',
        allowedOrigins: ['https://app.example'],
        state: 's1',
        params: { length: 6 },
      }),
    );
    expect(url.pathname).toBe('/pin/');
    expect(url.searchParams.get('v')).toBe(String(CONTRACT_VERSION));
    expect(url.searchParams.get('returnUrl')).toBe('https://app.example/cb');
    expect(url.searchParams.get('delivery')).toBe('hash');
    expect(url.searchParams.get('length')).toBe('6');
    expect(url.searchParams.get('allowedOrigins')).toBe('https://app.example');
  });

  it('maps orient → level and accepts compass / qr', () => {
    expect(new URL(openReturnApp('orient', { returnUrl: 'https://a.example/' })).pathname).toBe(
      '/level/',
    );
    expect(new URL(openReturnApp('compass', { returnUrl: 'https://a.example/' })).pathname).toBe(
      '/compass/',
    );
    expect(new URL(openReturnApp('qr', { returnUrl: 'https://a.example/' })).pathname).toBe('/qr/');
  });

  it('throws on unknown apps', () => {
    expect(() => openReturnApp('nope', { returnUrl: 'https://a.example/' })).toThrow(/Unknown/);
  });

  it('parses query and hash results (query wins on overlap)', () => {
    const hashed = parseReturnResult(
      'https://app.example/cb#value=from-hash&format=pin.digits&state=h',
    );
    expect(hashed.value).toBe('from-hash');
    expect(hashed.format).toBe('pin.digits');

    const mixed = parseReturnResult(
      'https://app.example/cb?value=from-query&format=pin.digits#value=from-hash&error=cancelled',
    );
    expect(mixed.value).toBe('from-query');
    expect(mixed.error).toBe('cancelled');
  });
});
