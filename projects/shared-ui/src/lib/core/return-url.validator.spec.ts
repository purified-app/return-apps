import { ReturnUrlValidator } from './return-url.validator';

describe('ReturnUrlValidator', () => {
  const validator = new ReturnUrlValidator();

  it('accepts localhost http URLs', () => {
    expect(validator.validate('http://localhost:4200/callback').ok).toBe(true);
  });

  it('accepts any https origin', () => {
    expect(validator.validate('https://example.com/callback').ok).toBe(true);
  });

  it('rejects javascript URLs', () => {
    expect(validator.validate('javascript:alert(1)').ok).toBe(false);
  });

  it('rejects plain http non-localhost URLs', () => {
    expect(validator.validate('http://example.com/callback').ok).toBe(false);
  });

  it('merges query params into existing returnUrl search', () => {
    const url = new URL('http://localhost:4200/demo-caller?existing=1');
    const redirect = validator.buildRedirectUrl(url, {
      scanValue: 'ABC',
      format: 'QR_CODE',
      state: 'demo1',
    });
    const parsed = new URL(redirect);
    expect(parsed.searchParams.get('existing')).toBe('1');
    expect(parsed.searchParams.get('scanValue')).toBe('ABC');
    expect(parsed.searchParams.get('format')).toBe('QR_CODE');
    expect(parsed.searchParams.get('state')).toBe('demo1');
  });

  it('supports signature redirects', () => {
    const url = new URL('http://localhost:4200/demo-caller');
    const redirect = validator.buildRedirectUrl(url, {
      signature: 'data:image/svg+xml;base64,abc',
      format: 'image/svg+xml',
      state: 'demo1',
    });
    const parsed = new URL(redirect);
    expect(parsed.searchParams.get('signature')).toBe('data:image/svg+xml;base64,abc');
    expect(parsed.searchParams.get('format')).toBe('image/svg+xml');
  });

  it('puts query params inside hash for hash-based return URLs', () => {
    const url = new URL('http://localhost:4200/#/demo-caller');
    const redirect = validator.buildRedirectUrl(url, {
      scanValue: 'XYZ',
      format: 'EAN_13',
      state: 'demo1',
    });
    expect(redirect).toBe(
      'http://localhost:4200/#/demo-caller?scanValue=XYZ&format=EAN_13&state=demo1',
    );
  });
});
