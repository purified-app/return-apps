import { decodeNdefRecord, decodeTextRecord, decodeUrlRecord, nfcFormatTag } from './nfc-codec';

describe('nfc-codec', () => {
  it('decodes well-known text and URL records', () => {
    const text = new Uint8Array([0x02, 0x65, 0x6e, ...new TextEncoder().encode('hi')]);
    expect(decodeTextRecord(text)).toBe('hi');

    const url = new Uint8Array([0x04, ...new TextEncoder().encode('example.com')]);
    expect(decodeUrlRecord(url)).toBe('https://example.com');
  });

  it('falls back to hex and builds format tags', () => {
    const data = new DataView(new Uint8Array([0xde, 0xad]).buffer);
    expect(decodeNdefRecord({ recordType: 'unknown', data })).toBe('dead');
    expect(nfcFormatTag('URL')).toBe('nfc.url');
    expect(nfcFormatTag('')).toBe('nfc.unknown');
  });
});
