import { parseQrOutput } from './qr-params';

describe('parseQrOutput', () => {
  it('defaults to svg', () => {
    expect(parseQrOutput(null)).toBe('svg');
    expect(parseQrOutput('')).toBe('svg');
    expect(parseQrOutput('svg')).toBe('svg');
  });

  it('accepts png aliases', () => {
    expect(parseQrOutput('png')).toBe('png');
    expect(parseQrOutput('QR.PNG')).toBe('png');
    expect(parseQrOutput('image/png')).toBe('png');
  });
});
