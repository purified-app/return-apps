import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, ALTranslate } from '@angular-libs/translate';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';
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

  readonly downloads = computed(() => {
    const svg = this.svg();
    if (!svg) {
      return [];
    }
    return [
      { kind: 'text' as const, text: svg, filename: 'qr.svg', mimeType: 'image/svg+xml', label: 'SVG' },
    ];
  });

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');
    const seed = params.get('text') ?? params.get('value') ?? '';
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

  onDone(): void {
    const value = this.text().trim();
    if (!value) {
      this.errorDetail.set(this.translate.get('qr.empty'));
      return;
    }
    this.generate();
    const dataUrl = qrSvgDataUrl(value);
    if (this.returnUrl) {
      this.status.set('redirecting');
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        { value: dataUrl, format: 'qr.svg', state: this.state },
        this.delivery,
      );
      return;
    }
    this.status.set('done');
  }

  reset(): void {
    this.status.set('ready');
    this.errorDetail.set(null);
  }
}
