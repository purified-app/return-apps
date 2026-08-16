import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';

type ColorStatus =
  | 'starting'
  | 'ready'
  | 'invalid-return-url'
  | 'denied'
  | 'error'
  | 'done'
  | 'redirecting';

type SampledColor = {
  hex: string;
  r: number;
  g: number;
  b: number;
};

@Component({
  selector: 'cb-color-page',
  imports: [RouterLink, RbPanel, RbResultActions],
  templateUrl: './color.page.html',
  styleUrl: './color.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class ColorPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly sampleCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('sampleCanvas');

  readonly status = signal<ColorStatus>('starting');
  readonly errorDetail = signal<string | null>(null);
  readonly liveColor = signal<SampledColor | null>(null);
  readonly captured = signal<SampledColor | null>(null);

  readonly copyValue = computed(() => this.captured()?.hex ?? null);

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private stream: MediaStream | null = null;
  private raf = 0;
  private ready = false;

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bootstrap();
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onCancel(): void {
    this.stopCamera();
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

  onUseColor(): void {
    const color = this.liveColor();
    if (!color) {
      this.errorDetail.set('No color sampled yet.');
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.stopCamera();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        {
          value: color.hex,
          format: 'color.hex',
          state: this.state,
          rgb: `${color.r},${color.g},${color.b}`,
        },
        this.delivery,
      );
      return;
    }

    this.captured.set(color);
    this.stopCamera();
    this.status.set('done');
  }

  async retryCamera(): Promise<void> {
    this.status.set('starting');
    this.errorDetail.set(null);
    await this.startCamera();
  }

  private bootstrap(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

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

    void this.startCamera();
  }

  private async startCamera(): Promise<void> {
    if (!this.ready) {
      return;
    }
    const video = this.videoRef()?.nativeElement;
    if (!video) {
      requestAnimationFrame(() => void this.startCamera());
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      video.srcObject = this.stream;
      await video.play();
      this.status.set('ready');
      this.sampleLoop();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.status.set('denied');
        this.errorDetail.set('Camera permission was denied. Allow camera access and try again.');
        return;
      }
      this.status.set('error');
      this.errorDetail.set(error instanceof Error ? error.message : 'Could not start camera.');
    }
  }

  private sampleLoop(): void {
    const video = this.videoRef()?.nativeElement;
    const canvas = this.sampleCanvasRef()?.nativeElement;
    if (!video || !canvas || video.readyState < 2) {
      this.raf = requestAnimationFrame(() => this.sampleLoop());
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const x = Math.floor(canvas.width / 2);
    const y = Math.floor(canvas.height / 2);
    const sampleSize = 5;
    const image = ctx.getImageData(
      Math.max(0, x - Math.floor(sampleSize / 2)),
      Math.max(0, y - Math.floor(sampleSize / 2)),
      sampleSize,
      sampleSize,
    );

    let r = 0;
    let g = 0;
    let b = 0;
    const pixels = image.data.length / 4;
    for (let i = 0; i < image.data.length; i += 4) {
      r += image.data[i] ?? 0;
      g += image.data[i + 1] ?? 0;
      b += image.data[i + 2] ?? 0;
    }
    r = Math.round(r / pixels);
    g = Math.round(g / pixels);
    b = Math.round(b / pixels);

    this.liveColor.set({
      hex: this.toHex(r, g, b),
      r,
      g,
      b,
    });

    this.raf = requestAnimationFrame(() => this.sampleLoop());
  }

  private toHex(r: number, g: number, b: number): string {
    const part = (n: number) => n.toString(16).padStart(2, '0');
    return `#${part(r)}${part(g)}${part(b)}`;
  }

  private stopCamera(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const video = this.videoRef()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }
}
