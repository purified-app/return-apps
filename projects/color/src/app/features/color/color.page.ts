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
import { TranslatePipe } from '@angular-libs/translate';
import {
  ReturnUrlValidator,
  RbPanel,
  RbResultActions,
  parseFlag,
  type ReturnDelivery,
} from 'shared-ui';
import { parseHexColor, rgbToHex, type SampledColor } from './color-hex';

type ColorStatus =
  | 'starting'
  | 'ready'
  | 'invalid-return-url'
  | 'denied'
  | 'error'
  | 'done'
  | 'redirecting';

type ColorMode = 'camera' | 'palette';

@Component({
  selector: 'cb-color-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
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
  readonly mode = signal<ColorMode>('camera');
  readonly modeLocked = signal(false);
  readonly hexDraft = signal('#808080');

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

  setMode(next: ColorMode): void {
    if (this.modeLocked() || this.mode() === next) {
      return;
    }
    this.mode.set(next);
    if (next === 'palette') {
      this.stopCamera();
      this.status.set('ready');
      if (!this.liveColor()) {
        this.applyHex(this.hexDraft());
      }
      return;
    }
    this.status.set('starting');
    void this.startCamera();
  }

  onHexInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.hexDraft.set(raw.startsWith('#') ? raw : `#${raw}`);
    this.applyHex(raw);
  }

  onPickerInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.hexDraft.set(raw);
    this.applyHex(raw);
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
    this.commitColor(color);
  }

  async retryCamera(): Promise<void> {
    this.captured.set(null);
    this.errorDetail.set(null);
    if (this.mode() === 'palette') {
      this.status.set('ready');
      this.applyHex(this.hexDraft());
      return;
    }
    this.status.set('starting');
    await this.startCamera();
  }

  private applyHex(raw: string): void {
    const parsed = parseHexColor(raw);
    if (parsed) {
      this.liveColor.set(parsed);
      this.hexDraft.set(parsed.hex);
    }
  }

  private commitColor(color: SampledColor): void {
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

  private bootstrap(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

    const modeParam = params.get('mode')?.trim().toLowerCase();
    if (modeParam === 'palette' || modeParam === 'picker') {
      this.mode.set('palette');
      this.modeLocked.set(true);
    } else if (modeParam === 'camera') {
      this.mode.set('camera');
      this.modeLocked.set(true);
    }

    const seed = parseHexColor(params.get('hex') ?? params.get('value'));
    if (seed) {
      this.liveColor.set(seed);
      this.hexDraft.set(seed.hex);
    } else if (this.mode() === 'palette') {
      this.applyHex('#808080');
    }

    if (parseFlag(params.get('palette')) && !modeParam) {
      this.mode.set('palette');
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

    if (this.mode() === 'palette') {
      this.status.set('ready');
      return;
    }
    void this.startCamera();
  }

  private async startCamera(): Promise<void> {
    if (!this.ready || this.mode() !== 'camera') {
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
    if (this.mode() !== 'camera') {
      return;
    }
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
      hex: rgbToHex(r, g, b),
      r,
      g,
      b,
    });

    this.raf = requestAnimationFrame(() => this.sampleLoop());
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
