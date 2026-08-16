import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, ALTranslate } from '@angular-libs/translate';
import {
  ReturnUrlValidator,
  RbPanel,
  RbResultActions,
  downloadBlob,
  parseFlag,
  type ResultDownload,
  type ReturnDelivery,
} from 'shared-ui';
import { parseQrOutput, type QrOutput } from './qr-params';
import { blobToDataUrl, qrPngBlob } from './qr-png';
import { qrSvg, qrSvgDataUrl } from './qr-svg';

type QrStatus = 'ready' | 'invalid-return-url' | 'done' | 'redirecting';

@Component({
  selector: 'qr-qr-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
  templateUrl: './qr.page.html',
  styleUrl: './qr.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class QrPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);
  private readonly translate = inject(ALTranslate);
  private readonly sanitizer = inject(DomSanitizer);

  readonly status = signal<QrStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly text = signal('');
  readonly svg = signal<string | null>(null);
  readonly preview = computed<SafeHtml | null>(() => {
    const svg = this.svg();
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  });

  readonly pngBusy = signal(false);

  readonly downloads = computed((): ResultDownload[] => {
    const svg = this.svg();
    const value = this.text().trim();
    if (!svg || !value) {
      return [];
    }
    return [
      {
        kind: 'text',
        text: svg,
        filename: 'qr.svg',
        mimeType: 'image/svg+xml',
        label: this.translate.get('qr.downloadSvg'),
      },
      {
        kind: 'blob',
        filename: 'qr.png',
        label: this.translate.get('qr.downloadPng'),
        getBlob: () => qrPngBlob(value),
      },
    ];
  });

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private output: QrOutput = 'svg';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.output = parseQrOutput(params.get('output'));
    this.delivery = this.returnUrlValidator.parseDelivery(
      params.get('delivery'),
      this.output === 'png' ? 'hash' : 'query',
    );
    const seed = params.get('text') ?? params.get('value') ?? '';
    const auto = parseFlag(params.get('auto'));
    if (seed) {
      this.text.set(seed);
      this.generate();
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

    if (auto && seed.trim()) {
      if (this.returnUrl) {
        void this.onDone();
      } else if (this.output === 'png') {
        void this.downloadPng();
      } else {
        this.status.set('done');
      }
    }
  }

  onInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
  }

  generate(): void {
    const value = this.text().trim();
    if (!value) {
      this.errorDetail.set(this.translate.get('qr.empty'));
      this.svg.set(null);
      return;
    }
    this.errorDetail.set(null);
    this.svg.set(qrSvg(value));
  }

  async downloadPng(): Promise<void> {
    const value = this.text().trim();
    if (!value) {
      this.errorDetail.set(this.translate.get('qr.empty'));
      return;
    }
    this.generate();
    this.pngBusy.set(true);
    this.errorDetail.set(null);
    try {
      downloadBlob(await qrPngBlob(value), 'qr.png');
    } catch {
      this.errorDetail.set(this.translate.get('common.downloadFailed', { filename: 'qr.png' }));
    } finally {
      this.pngBusy.set(false);
    }
  }

  onCancel(): void {
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

  async onDone(): Promise<void> {
    const value = this.text().trim();
    if (!value) {
      this.errorDetail.set(this.translate.get('qr.empty'));
      return;
    }
    this.generate();
    if (this.returnUrl) {
      this.status.set('redirecting');
      this.pngBusy.set(true);
      try {
        const payload =
          this.output === 'png'
            ? { value: await blobToDataUrl(await qrPngBlob(value)), format: 'qr.png' }
            : { value: qrSvgDataUrl(value), format: 'qr.svg' };
        location.href = this.returnUrlValidator.buildRedirectUrl(
          this.returnUrl,
          { ...payload, state: this.state },
          this.delivery,
        );
      } catch {
        this.status.set('ready');
        this.errorDetail.set(this.translate.get('common.downloadFailed', { filename: 'qr.png' }));
      } finally {
        this.pngBusy.set(false);
      }
      return;
    }
    this.status.set('done');
  }

  reset(): void {
    this.status.set('ready');
    this.errorDetail.set(null);
  }
}
