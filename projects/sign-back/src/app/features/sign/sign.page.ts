import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnUrlValidator, RbPanel } from 'shared-ui';
import { SignaturePadService } from './signature-pad';

type SignStatus =
  | 'ready'
  | 'invalid-return-url'
  | 'empty'
  | 'too-large'
  | 'done'
  | 'redirecting';

const MAX_SIGNATURE_CHARS = 7000;

@Component({
  selector: 'sb-sign-page',
  imports: [RouterLink, RbPanel],
  templateUrl: './sign.page.html',
  styleUrl: './sign.page.scss',
  host: { class: 'rb-page rb-page--plain' },
})
export class SignPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);
  private readonly pad = inject(SignaturePadService);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('pad');

  readonly status = signal<SignStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private ready = false;

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bootstrap();
    });
  }

  ngOnDestroy(): void {
    this.pad.detach();
  }

  onClear(): void {
    this.pad.clear();
    this.previewUrl.set(null);
    if (this.status() === 'empty' || this.status() === 'too-large' || this.status() === 'done') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onCancel(): void {
    this.pad.detach();
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

  onDone(): void {
    if (this.pad.isEmpty()) {
      this.status.set('empty');
      this.errorDetail.set('Please draw a signature first.');
      return;
    }

    const signature = this.pad.toSvgDataUrl();
    if (signature.length > MAX_SIGNATURE_CHARS) {
      this.status.set('too-large');
      this.errorDetail.set(
        'Signature is too large to return via URL. Clear and try a simpler signature.',
      );
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      location.href = this.returnUrlValidator.buildRedirectUrl(this.returnUrl, {
        signature,
        format: 'image/svg+xml',
        state: this.state,
      });
      return;
    }

    this.previewUrl.set(signature);
    this.status.set('done');
  }

  private bootstrap(): void {
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

    this.attachPad();
  }

  private attachPad(): void {
    if (!this.ready) {
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      requestAnimationFrame(() => this.attachPad());
      return;
    }
    this.pad.attach(canvas);
  }
}
