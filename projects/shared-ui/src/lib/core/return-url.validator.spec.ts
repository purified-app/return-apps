import { ReturnUrlValidator, readReturnParams } from './return-url.validator';

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

  it('reads return params from hash', () => {
    const params = {
      get: () => null,
      keys: [] as string[],
    };
    const result = readReturnParams(params as never, '#value=secret&format=pin.digits');
    expect(result.value).toBe('secret');
    expect(result.format).toBe('pin.digits');
  });
});
