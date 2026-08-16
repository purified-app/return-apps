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
