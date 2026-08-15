import { ReturnUrlValidator } from './return-url.validator';
import { ReturnSession } from './return-session';
import { parseReturnResult } from './parse-return-result';
import { buildOpenUrl } from './build-open-url';

describe('ReturnUrlValidator', () => {
  const validator = new ReturnUrlValidator();

  it('accepts localhost http URLs', () => {
    expect(validator.validate('http://localhost:4200/callback').ok).toBe(true);
  });

  it('accepts ::1 localhost', () => {
    expect(validator.validate('http://[::1]:4200/callback').ok).toBe(true);
  });

  it('accepts any https origin when no allowlist', () => {
    expect(validator.validate('https://example.com/callback').ok).toBe(true);
  });

  it('rejects javascript URLs', () => {
    expect(validator.validate('javascript:alert(1)').ok).toBe(false);
  });

  it('rejects plain http non-localhost URLs', () => {
    expect(validator.validate('http://example.com/callback').ok).toBe(false);
  });

  it('enforces allowedOrigins when provided', () => {
    const denied = validator.validate('https://evil.example/cb', {
      allowedOrigins: ['https://app.example'],
    });
    expect(denied.ok).toBe(false);

    const allowed = validator.validate('https://app.example/cb', {
      allowedOrigins: ['https://app.example'],
    });
    expect(allowed.ok).toBe(true);
  });

  it('parses allowedOrigins CSV', () => {
    expect(validator.parseAllowedOrigins('https://a.example, https://b.example')).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
    expect(validator.parseAllowedOrigins(null)).toBeNull();
  });

  it('merges value/format into query delivery', () => {
    const url = new URL('http://localhost:4200/demo-caller?existing=1');
    const redirect = validator.buildRedirectUrl(
      url,
      { value: 'ABC', format: 'scan.qr_code', state: 'demo1' },
      'query',
    );
    const parsed = new URL(redirect);
    expect(parsed.searchParams.get('existing')).toBe('1');
    expect(parsed.searchParams.get('value')).toBe('ABC');
    expect(parsed.searchParams.get('format')).toBe('scan.qr_code');
    expect(parsed.searchParams.get('state')).toBe('demo1');
  });

  it('puts params in fragment for hash delivery', () => {
    const url = new URL('http://localhost:4200/demo-caller');
    const redirect = validator.buildRedirectUrl(
      url,
      { value: '1234', format: 'pin.digits', state: 'demo1' },
      'hash',
    );
    expect(redirect).toBe(
      'http://localhost:4200/demo-caller#value=1234&format=pin.digits&state=demo1',
    );
  });

  it('puts query params inside hash for hash-based return URLs', () => {
    const url = new URL('http://localhost:4200/#/demo-caller');
    const redirect = validator.buildRedirectUrl(
      url,
      { value: 'XYZ', format: 'scan.ean_13', state: 'demo1' },
      'query',
    );
    expect(redirect).toBe(
      'http://localhost:4200/#/demo-caller?value=XYZ&format=scan.ean_13&state=demo1',
    );
  });
});

describe('ReturnSession', () => {
  const validator = new ReturnUrlValidator();

  function paramMap(entries: Record<string, string>) {
    return {
      get: (key: string) => entries[key] ?? null,
      keys: Object.keys(entries),
    };
  }

  it('opens standalone when returnUrl is missing', () => {
    const init = ReturnSession.open(validator, paramMap({ state: 's1' }) as never, {
      delivery: 'hash',
    });
    expect(init.ok).toBe(true);
    expect(init.session.isReturnMode).toBe(false);
    expect(init.session.state).toBe('s1');
    expect(init.session.delivery).toBe('hash');
  });

  it('rejects disallowed origins', () => {
    const init = ReturnSession.open(
      validator,
      paramMap({
        returnUrl: 'https://evil.example/cb',
        allowedOrigins: 'https://good.example',
      }) as never,
    );
    expect(init.ok).toBe(false);
  });
});

describe('parseReturnResult', () => {
  function paramMap(entries: Record<string, string>) {
    return {
      get: (key: string) => entries[key] ?? null,
      keys: Object.keys(entries),
      has: (key: string) => key in entries,
    };
  }

  it('reads value from hash fragment', () => {
    const result = parseReturnResult(
      paramMap({}) as never,
      '#value=secret&format=pin.digits&state=demo1',
    );
    expect(result.value).toBe('secret');
    expect(result.format).toBe('pin.digits');
    expect(result.state).toBe('demo1');
  });

  it('prefers query over hash when both present', () => {
    const result = parseReturnResult(
      paramMap({ value: 'from-query' }) as never,
      '#value=from-hash',
    );
    expect(result.value).toBe('from-query');
  });
});

describe('buildOpenUrl', () => {
  it('includes contract version, allowlist, and delivery', () => {
    const url = buildOpenUrl({
      baseUrl: 'https://return.purified.app/pin',
      returnUrl: 'https://app.example/cb',
      state: 's1',
      allowedOrigins: ['https://app.example'],
      delivery: 'hash',
      params: { length: 6 },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('v')).toBe('1');
    expect(parsed.searchParams.get('returnUrl')).toBe('https://app.example/cb');
    expect(parsed.searchParams.get('allowedOrigins')).toBe('https://app.example');
    expect(parsed.searchParams.get('delivery')).toBe('hash');
    expect(parsed.searchParams.get('length')).toBe('6');
  });
});
