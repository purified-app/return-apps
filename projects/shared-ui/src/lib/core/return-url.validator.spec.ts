import { ReturnUrlValidator } from './return-url.validator';
import {
  ReturnSession,
  buildOpenUrl,
  parseReturnResult,
  taggedFormat,
} from './return';

describe('ReturnUrlValidator', () => {
  const validator = new ReturnUrlValidator();

  it('accepts localhost http URLs', () => {
    expect(validator.validate('http://localhost:4200/callback').ok).toBe(true);
  });

  it('accepts any https origin when no allowlist', () => {
    expect(validator.validate('https://example.com/callback').ok).toBe(true);
  });

  it('rejects javascript URLs', () => {
    expect(validator.validate('javascript:alert(1)').ok).toBe(false);
  });

  it('enforces allowedOrigins when provided', () => {
    expect(
      validator.validate('https://evil.example/cb', {
        allowedOrigins: ['https://app.example'],
      }).ok,
    ).toBe(false);
    expect(
      validator.validate('https://app.example/cb', {
        allowedOrigins: ['https://app.example'],
      }).ok,
    ).toBe(true);
  });

  it('supports query and hash delivery', () => {
    const url = new URL('http://localhost:4200/demo-caller');
    const query = validator.buildRedirectUrl(
      url,
      { value: 'ABC', format: 'scan.qr_code', state: 'demo1' },
      'query',
    );
    expect(new URL(query).searchParams.get('value')).toBe('ABC');

    const hash = validator.buildRedirectUrl(
      url,
      { value: '1234', format: 'pin.digits' },
      'hash',
    );
    expect(hash).toContain('#value=1234&format=pin.digits');
  });
});

describe('ReturnSession + helpers', () => {
  const validator = new ReturnUrlValidator();
  const paramMap = (entries: Record<string, string>) =>
    ({
      get: (key: string) => entries[key] ?? null,
      keys: Object.keys(entries),
    }) as never;

  it('opens standalone when returnUrl is missing', () => {
    const init = ReturnSession.open(validator, paramMap({ state: 's1' }), {
      delivery: 'hash',
    });
    expect(init.ok).toBe(true);
    expect(init.session.isReturnMode).toBe(false);
  });

  it('parses hash results and builds open URLs', () => {
    const result = parseReturnResult(paramMap({}), '#value=secret&format=pin.digits');
    expect(result.value).toBe('secret');

    const url = buildOpenUrl({
      baseUrl: 'https://return.purified.app/pin',
      returnUrl: 'https://app.example/cb',
      allowedOrigins: ['https://app.example'],
      delivery: 'hash',
    });
    expect(new URL(url).searchParams.get('v')).toBe('1');
    expect(taggedFormat('scan', 'QR_CODE')).toBe('scan.qr_code');
  });
});
