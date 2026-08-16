import { parseScanFormats, scanFormatTag } from './scan-formats';

describe('scan-formats', () => {
  it('defaults when empty and maps aliases', () => {
    expect(parseScanFormats(null)[0]).toBe('qr_code');
    expect(parseScanFormats('QR,ean_13')).toEqual(['qr_code', 'ean_13']);
    expect(parseScanFormats('nope')).toEqual(parseScanFormats(null));
  });

  it('dedupes and builds return tags', () => {
    expect(parseScanFormats('qr_code,QR,qr')).toEqual(['qr_code']);
    expect(scanFormatTag('QR_CODE')).toBe('scan.qr_code');
    expect(scanFormatTag('')).toBe('scan.unknown');
  });
});
