import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@angular-libs/translate';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';
import { decodeNdefRecord, nfcFormatTag } from './nfc-codec';

type NfcStatus =
  | 'idle'
  | 'scanning'
  | 'writing'
  | 'invalid-return-url'
  | 'unsupported'
  | 'error'
  | 'done'
  | 'redirecting';

type NfcMode = 'read' | 'write';

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

type NdefWriterLike = {
  write: (
    message: { records: Array<{ recordType: string; data: string }> },
    options?: { signal?: AbortSignal },
  ) => Promise<void>;
};

declare global {
  interface Window {
    NDEFReader?: new () => NdefReaderLike;
    NDEFWriter?: new () => NdefWriterLike;
  }
}

@Component({
  selector: 'nb-nfc-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
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
  readonly mode = signal<NfcMode>('read');
  readonly modeLocked = signal(false);
  readonly writeText = signal('');

  readonly copyValue = computed(() => this.reading()?.nfcValue ?? null);

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private abort: AbortController | null = null;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

    const modeParam = params.get('mode')?.trim().toLowerCase();
    if (modeParam === 'write') {
      this.mode.set('write');
      this.modeLocked.set(true);
    } else if (modeParam === 'read') {
      this.mode.set('read');
      this.modeLocked.set(true);
    }

    const payload = params.get('text') ?? params.get('payload') ?? '';
    if (payload) {
      this.writeText.set(payload);
    }

    const rawReturnUrl = params.get('returnUrl');
    if (rawReturnUrl) {
      const validation = this.returnUrlValidator.validate(rawReturnUrl, {
        allowedOrigins: this.returnUrlValidator.parseAllowedOrigins(params.get('allowedOrigins')),
      });
      if (!validation.ok) {
        this.status.set('invalid-return-url');
        this.errorDetail.set(validation.reason);
        return;
      }
      this.returnUrl = validation.url;
    }

    if (this.mode() === 'write') {
      this.status.set('idle');
      return;
    }
    void this.startScan();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }

  setMode(next: NfcMode): void {
    if (this.modeLocked() || this.mode() === next) {
      return;
    }
    this.stopScan();
    this.mode.set(next);
    this.errorDetail.set(null);
    this.reading.set(null);
    if (next === 'read') {
      void this.startScan();
      return;
    }
    this.status.set('idle');
  }

  onWriteInput(event: Event): void {
    this.writeText.set((event.target as HTMLInputElement).value);
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

  async startWrite(): Promise<void> {
    const text = this.writeText().trim();
    if (!text) {
      this.errorDetail.set('Enter text to write.');
      return;
    }
    const Writer = window.NDEFWriter ?? window.NDEFReader;
    if (!Writer) {
      this.status.set('unsupported');
      this.errorDetail.set(
        'Web NFC is not available. Use Chrome on Android over HTTPS, then try again.',
      );
      return;
    }

    this.stopScan();
    this.abort = new AbortController();
    this.status.set('writing');
    this.errorDetail.set(null);

    try {
      const writer = new Writer() as NdefWriterLike;
      await writer.write({ records: [{ recordType: 'text', data: text }] }, {
        signal: this.abort.signal,
      });
      const reading: NfcReading = { nfcValue: text, recordType: 'text' };
      this.reading.set(reading);
      this.commit(reading, 'nfc.written');
    } catch (error) {
      if (this.abort?.signal.aborted) {
        return;
      }
      this.status.set('error');
      this.errorDetail.set(error instanceof Error ? error.message : 'NFC write failed.');
    }
  }

  onCancel(): void {
    this.stopScan();
    if (this.returnUrl) {
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        { error: 'cancelled', state: this.state },
        this.delivery,
      );
      return;
    }
    if (history.length > 1) {
      history.back();
      return;
    }
    void this.router.navigateByUrl('/home');
  }

  retry(): void {
    this.reading.set(null);
    this.errorDetail.set(null);
    if (this.mode() === 'write') {
      this.status.set('idle');
      return;
    }
    void this.startScan();
  }

  private onReading(event: NdefReadingEvent): void {
    const record = event.message.records[0];
    if (!record) {
      this.status.set('error');
      this.errorDetail.set('NFC tag had no readable records.');
      return;
    }

    const reading: NfcReading = {
      nfcValue: decodeNdefRecord(record),
      recordType: record.recordType,
    };
    this.reading.set(reading);
    this.stopScan();
    this.commit(reading, nfcFormatTag(reading.recordType));
  }

  private commit(reading: NfcReading, format: string): void {
    if (this.returnUrl) {
      this.status.set('redirecting');
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        {
          value: reading.nfcValue,
          format,
          state: this.state,
          recordType: reading.recordType,
        },
        this.delivery,
      );
      return;
    }

    this.status.set('done');
  }

  private stopScan(): void {
    this.abort?.abort();
    this.abort = null;
  }
}
