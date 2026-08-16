export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function decodeTextRecord(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '';
  }
  const status = bytes[0]!;
  const langLength = status & 0x3f;
  const encoding = status & 0x80 ? 'utf-16' : 'utf-8';
  const textBytes = bytes.slice(1 + langLength);
  return new TextDecoder(encoding).decode(textBytes);
}

export function decodeUrlRecord(bytes: Uint8Array): string {
  const prefixes = [
    '',
    'http://www.',
    'https://www.',
    'http://',
    'https://',
    'tel:',
    'mailto:',
    'ftp://anonymous:anonymous@',
    'ftp://ftp.',
    'ftps://',
    'sftp://',
    'smb://',
    'nfs://',
    'ftp://',
    'dav://',
    'news:',
    'telnet://',
    'imap:',
    'rtsp://',
    'urn:',
    'pop:',
    'sip:',
    'sips:',
    'tftp:',
    'btspp://',
    'btl2cap://',
    'btgoep://',
    'tcpobex://',
    'irdaobex://',
    'file://',
    'urn:epc:id:',
    'urn:epc:tag:',
    'urn:epc:pat:',
    'urn:epc:raw:',
    'urn:epc:',
    'urn:nfc:',
  ];
  if (bytes.length === 0) {
    return '';
  }
  const prefix = prefixes[bytes[0]!] ?? '';
  return prefix + new TextDecoder().decode(bytes.slice(1));
}

export function decodeNdefRecord(record: {
  recordType: string;
  data?: DataView;
  mediaType?: string;
}): string {
  if (!record.data) {
    return record.recordType;
  }

  const bytes = new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);

  if (record.recordType === 'url' || record.recordType === 'text' || record.recordType === 'mime') {
    try {
      if (record.recordType === 'url') {
        return decodeUrlRecord(bytes);
      }
      if (record.recordType === 'text') {
        return decodeTextRecord(bytes);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      // fall through to hex
    }
  }

  return bytesToHex(bytes);
}

export function nfcFormatTag(recordType: string): string {
  const normalized = recordType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `nfc.${normalized || 'unknown'}`;
}
