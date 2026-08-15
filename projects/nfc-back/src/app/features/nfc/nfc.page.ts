import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnUrlValidator, RbPanel } from 'shared-ui';

type NfcStatus =
  | 'idle'
  | 'scanning'
  | 'invalid-return-url'
  | 'unsupported'
  | 'error'
  | 'done'
  | 'redirecting';

type NfcReading = {
  nfcValue: string;
  recordType: string;
};

/** Minimal Web NFC typings (not in all TS lib targets). */
type NdefReadingEvent = Event & {
  message: {
    records: Array<{
      recordType: string;
      data?: DataView;
      mediaType?: string;
    }>;
  };
};

type NdefReaderLike = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    type: 'reading' | 'readingerror',
    listener: (event: Event) => void,
  ) => void;
};

declare global {
  interface Window {
    NDEFReader?: new () => NdefReaderLike;
  }
}

@Component({
  selector: 'nb-nfc-page',
  imports: [RouterLink, RbPanel],
  templateUrl: './nfc.page.html',
  styleUrl: './nfc.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class NfcPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly status = signal<NfcStatus>('idle');
  readonly errorDetail = signal<string | null>(null);
  readonly reading = signal<NfcReading | null>(null);

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private abort: AbortController | null = null;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');

    const rawReturnUrl = params.get('returnUrl');
    if (rawReturnUrl) {
      const validation = this.returnUrlValidator.validate(rawReturnUrl);
      if (!validation.ok) {
        this.status.set('invalid-return-url');
        this.errorDetail.set(validation.reason);
        return;
      }
      this.returnUrl = validation.url;
    }

    void this.startScan();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }

  async startScan(): Promise<void> {
    if (!window.NDEFReader) {
      this.status.set('unsupported');
      this.errorDetail.set(
        'Web NFC is not available. Use Chrome on Android over HTTPS, then try again.',
      );
      return;
    }

    this.stopScan();
    this.abort = new AbortController();
    this.status.set('scanning');
    this.errorDetail.set(null);
    this.reading.set(null);

    try {
      const reader = new window.NDEFReader();
      reader.addEventListener('reading', (event) => this.onReading(event as NdefReadingEvent));
      reader.addEventListener('readingerror', () => {
        this.status.set('error');
        this.errorDetail.set('Could not read that NFC tag. Try again.');
      });
      await reader.scan({ signal: this.abort.signal });
    } catch (error) {
      if (this.abort?.signal.aborted) {
        return;
      }
      this.status.set('error');
      this.errorDetail.set(error instanceof Error ? error.message : 'NFC scan failed.');
    }
  }

  onCancel(): void {
    this.stopScan();
    if (this.returnUrl) {
      location.href = this.returnUrlValidator.buildRedirectUrl(this.returnUrl, {
        error: 'cancelled',
        state: this.state,
      });
      return;
    }
    if (history.length > 1) {
      history.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  private onReading(event: NdefReadingEvent): void {
    const record = event.message.records[0];
    if (!record) {
      this.status.set('error');
      this.errorDetail.set('NFC tag had no readable records.');
      return;
    }

    const nfcValue = this.decodeRecord(record);
    const reading: NfcReading = {
      nfcValue,
      recordType: record.recordType,
    };
    this.reading.set(reading);
    this.stopScan();

    if (this.returnUrl) {
      this.status.set('redirecting');
      location.href = this.returnUrlValidator.buildRedirectUrl(this.returnUrl, {
        nfcValue: reading.nfcValue,
        recordType: reading.recordType,
        format: 'nfc',
        state: this.state,
      });
      return;
    }

    this.status.set('done');
  }

  private decodeRecord(record: {
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
          return this.decodeUrlRecord(bytes);
        }
        if (record.recordType === 'text') {
          return this.decodeTextRecord(bytes);
        }
        return new TextDecoder().decode(bytes);
      } catch {
        // fall through to hex
      }
    }

    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private decodeTextRecord(bytes: Uint8Array): string {
    if (bytes.length === 0) {
      return '';
    }
    const status = bytes[0]!;
    const langLength = status & 0x3f;
    const encoding = status & 0x80 ? 'utf-16' : 'utf-8';
    const textBytes = bytes.slice(1 + langLength);
    return new TextDecoder(encoding).decode(textBytes);
  }

  private decodeUrlRecord(bytes: Uint8Array): string {
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

  private stopScan(): void {
    this.abort?.abort();
    this.abort = null;
  }
}
