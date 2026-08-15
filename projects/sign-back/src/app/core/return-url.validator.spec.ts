import { ReturnUrlValidator } from './return-url.validator';

describe('ReturnUrlValidator', () => {
  const validator = new ReturnUrlValidator();

  it('accepts https URLs', () => {
    expect(validator.validate('https://example.com/callback').ok).toBe(true);
  });

  it('rejects javascript URLs', () => {
    expect(validator.validate('javascript:alert(1)').ok).toBe(false);
  });

  it('merges signature into returnUrl', () => {
    const url = new URL('http://localhost:4200/demo-caller?existing=1');
    const redirect = validator.buildRedirectUrl(url, {
      signature: 'data:image/svg+xml;base64,abc',
      format: 'image/svg+xml',
      state: 'demo1',
    });
    const parsed = new URL(redirect);
    expect(parsed.searchParams.get('existing')).toBe('1');
    expect(parsed.searchParams.get('signature')).toBe('data:image/svg+xml;base64,abc');
    expect(parsed.searchParams.get('format')).toBe('image/svg+xml');
    expect(parsed.searchParams.get('state')).toBe('demo1');
  });
});
