import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@angular-libs/translate';
import {
  RbPanel,
  RbResultActions,
  ReturnUrlValidator,
  cardinalLabel,
  parseFlag,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
  type OrientationSample,
  type ReturnDelivery,
} from 'shared-ui';

type CompassStatus =
  | 'need-gesture'
  | 'listening'
  | 'invalid-return-url'
  | 'unsupported'
  | 'denied'
  | 'manual'
  | 'done'
  | 'redirecting';

type DeviceOrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | string>;
};

type WakeLockSentinelLike = { release: () => Promise<void> };

@Component({
  selector: 'cm-compass-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
  templateUrl: './compass.page.html',
  styleUrl: './compass.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class CompassPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly status = signal<CompassStatus>('need-gesture');
  readonly errorDetail = signal<string | null>(null);
  readonly held = signal(false);
  readonly copyFlash = signal(false);
  readonly hasReturnUrl = signal(false);

  private readonly liveSample = signal<OrientationSample | null>(null);
  private readonly heldSample = signal<OrientationSample | null>(null);

  readonly sample = computed(() => (this.held() ? this.heldSample() : this.liveSample()));
  readonly captured = signal<string | null>(null);
  readonly copyValue = computed(() => this.captured());
  readonly liveValue = computed(() => {
    const s = this.sample();
    return s ? valueForMode('compass', s) : null;
  });
  readonly primaryReadout = computed(() => {
    const heading = this.sample()?.heading;
    return heading == null ? '—' : `${roundOrient(heading, 0)}°`;
  });
  readonly secondaryReadout = computed(() => {
    const heading = this.sample()?.heading;
    return heading == null ? '' : cardinalLabel(heading);
  });
  readonly compassRotation = computed(() => {
    const heading = this.sample()?.heading;
    return heading == null ? 0 : -heading;
  });
  readonly confirmLabel = computed(() =>
    this.hasReturnUrl() ? 'Use reading' : 'Capture reading',
  );

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private listening = false;
  private copyTimer = 0;
  private wakeLock: WakeLockSentinelLike | null = null;
  private readonly onOrientation = (event: DeviceOrientationEvent) => this.handleOrientation(event);
  private readonly onVisibility = () => {
    if (document.visibilityState === 'visible' && this.listening) {
      void this.requestWakeLock();
    }
  };

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');
    parseFlag(params.get('absolute'));

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
      this.hasReturnUrl.set(true);
    }

    document.addEventListener('visibilitychange', this.onVisibility);

    if (!this.deviceOrientationSupported()) {
      this.useManual();
      return;
    }

    const DOE = DeviceOrientationEvent as DeviceOrientationConstructor;
    if (typeof DOE.requestPermission === 'function') {
      this.status.set('need-gesture');
      return;
    }

    void this.startSensors();
  }

  ngOnDestroy(): void {
    this.stopSensors();
    document.removeEventListener('visibilitychange', this.onVisibility);
    void this.releaseWakeLock();
    if (this.copyTimer) {
      window.clearTimeout(this.copyTimer);
    }
  }

  async enableSensors(): Promise<void> {
    await this.startSensors();
  }

  async startSensors(): Promise<void> {
    this.errorDetail.set(null);
    this.held.set(false);
    this.heldSample.set(null);

    const DOE = DeviceOrientationEvent as DeviceOrientationConstructor;
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result !== 'granted') {
          this.status.set('denied');
          this.errorDetail.set('Motion/orientation permission was denied.');
          return;
        }
      } catch {
        this.status.set('denied');
        this.errorDetail.set('Could not request orientation permission.');
        return;
      }
    }

    this.stopSensors();
    window.addEventListener('deviceorientation', this.onOrientation, true);
    this.listening = true;
    this.status.set('listening');
    void this.requestWakeLock();

    window.setTimeout(() => {
      if (this.status() !== 'listening') {
        return;
      }
      if (!this.hasUsefulSample(this.liveSample())) {
        this.useManual();
      }
    }, 1500);
  }

  useManual(): void {
    this.stopSensors();
    void this.releaseWakeLock();
    this.status.set('manual');
    this.held.set(false);
    this.heldSample.set(null);
    this.ensureManualSample();
  }

  toggleHold(): void {
    if (this.held()) {
      this.held.set(false);
      this.heldSample.set(null);
      return;
    }
    const current = this.liveSample();
    if (!current || !this.hasUsefulSample(current)) {
      return;
    }
    this.heldSample.set({ ...current });
    this.held.set(true);
  }

  async copyLive(): Promise<void> {
    const value = this.liveValue();
    if (value == null || !navigator.clipboard?.writeText) {
      this.errorDetail.set('Nothing to copy yet.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      this.copyFlash.set(true);
      if (this.copyTimer) {
        window.clearTimeout(this.copyTimer);
      }
      this.copyTimer = window.setTimeout(() => this.copyFlash.set(false), 1200);
    } catch {
      this.errorDetail.set('Could not copy to clipboard.');
    }
  }

  onManualHeading(event: Event): void {
    const heading = Number((event.target as HTMLInputElement).value);
    const base = this.liveSample() ?? {
      heading: 0,
      pitch: 0,
      roll: 0,
      incline: 0,
      absolute: false,
    };
    this.liveSample.set({
      ...base,
      heading: ((heading % 360) + 360) % 360,
    });
  }

  onCancel(): void {
    this.stopSensors();
    void this.releaseWakeLock();
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

  onConfirm(): void {
    const current = this.sample();
    const value = current ? valueForMode('compass', current) : null;
    if (value == null || !current) {
      this.errorDetail.set('No reading available yet.');
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.stopSensors();
      void this.releaseWakeLock();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        {
          value,
          format: 'compass.heading',
          state: this.state,
          mode: 'compass',
          heading: String(roundOrient(current.heading ?? Number(value))),
        },
        this.delivery,
      );
      return;
    }

    this.captured.set(value);
    this.stopSensors();
    void this.releaseWakeLock();
    this.status.set('done');
  }

  retry(): void {
    this.captured.set(null);
    this.errorDetail.set(null);
    this.held.set(false);
    this.heldSample.set(null);
    if (!this.deviceOrientationSupported()) {
      this.useManual();
      return;
    }
    const DOE = DeviceOrientationEvent as DeviceOrientationConstructor;
    if (typeof DOE.requestPermission === 'function') {
      this.status.set('need-gesture');
      return;
    }
    void this.startSensors();
  }

  private handleOrientation(event: DeviceOrientationEvent): void {
    if (this.held()) {
      return;
    }
    const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
      .webkitCompassHeading;
    const next = sampleFromDeviceOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute,
      webkitCompassHeading: webkitHeading,
    });
    if (!this.hasUsefulSample(next)) {
      return;
    }
    this.liveSample.set(next);
  }

  private ensureManualSample(): void {
    const current = this.liveSample();
    this.liveSample.set({
      heading: current?.heading ?? 0,
      pitch: current?.pitch ?? 0,
      roll: current?.roll ?? 0,
      incline: current?.incline ?? 0,
      absolute: false,
    });
  }

  private hasUsefulSample(sample: OrientationSample | null): boolean {
    return sample?.heading != null || sample?.pitch != null || sample?.roll != null;
  }

  private deviceOrientationSupported(): boolean {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  private stopSensors(): void {
    if (this.listening) {
      window.removeEventListener('deviceorientation', this.onOrientation, true);
      this.listening = false;
    }
  }

  private async requestWakeLock(): Promise<void> {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock?.request) {
      return;
    }
    try {
      this.wakeLock = await nav.wakeLock.request('screen');
    } catch {
      /* ignore */
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (!this.wakeLock) {
      return;
    }
    try {
      await this.wakeLock.release();
    } catch {
      /* ignore */
    }
    this.wakeLock = null;
  }
}
