import { ReturnUrlValidator } from './return-url.validator';
import { buildOpenUrl, readReturnParams } from './return-helpers';

describe('ReturnUrlValidator', () => {
  const validator = new ReturnUrlValidator();

  it('accepts localhost http URLs', () => {
    expect(validator.validate('http://localhost:4200/callback').ok).toBe(true);
  });

  it('enforces allowedOrigins when provided', () => {
    expect(
      validator.validate('https://evil.example/cb', {
        allowedOrigins: ['https://app.example'],
      }).ok,
    ).toBe(false);
  });

  it('supports query and hash delivery', () => {
    const url = new URL('http://localhost:4200/demo-caller');
    const hash = validator.buildRedirectUrl(
      url,
      { value: '1234', format: 'pin.digits' },
      'hash',
    );
    expect(hash).toContain('#value=1234&format=pin.digits');
  });

  it('rejects non-https remote URLs and empty returnUrl', () => {
    expect(validator.validate('').ok).toBe(false);
    expect(validator.validate('not-a-url').ok).toBe(false);
    expect(validator.validate('http://example.com/cb').ok).toBe(false);
    expect(validator.validate('https://app.example/cb').ok).toBe(true);
  });

  it('parses allowedOrigins and delivery', () => {
    expect(validator.parseAllowedOrigins('https://app.example, https://other.example')).toEqual([
      'https://app.example',
      'https://other.example',
    ]);
    expect(validator.parseAllowedOrigins('')).toBeNull();
    expect(validator.parseDelivery('hash', 'query')).toBe('hash');
    expect(validator.parseDelivery('nope', 'query')).toBe('query');
  });

  it('puts params in the hash query for hash-router return URLs', () => {
    const url = new URL('https://app.example/app#/callback');
    const redirect = validator.buildRedirectUrl(
      url,
      { value: 'x', format: 'pin.digits' },
      'query',
    );
    expect(redirect).toContain('#/callback?value=x&format=pin.digits');
  });
});

describe('return helpers', () => {
  it('reads return params from hash and builds open URLs', () => {
    const params = { get: () => null, keys: [] as string[] };
    const result = readReturnParams(params as never, '#value=secret&format=pin.digits');
    expect(result.value).toBe('secret');

    const url = buildOpenUrl({
      baseUrl: 'https://return.purified.app/pin',
      returnUrl: 'https://app.example/cb',
      allowedOrigins: ['https://app.example'],
      delivery: 'hash',
    });
    expect(new URL(url).searchParams.get('delivery')).toBe('hash');
  });
});
