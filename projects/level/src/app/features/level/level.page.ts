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
  LEVEL_MODES,
  RbPanel,
  RbResultActions,
  ReturnUrlValidator,
  formatForMode,
  isWithinLevelThreshold,
  levelDeviation,
  parseFlag,
  parseLevelMode,
  parseOrientMode,
  parseThreshold,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
  withInclineTare,
  type LevelMode,
  type OrientationSample,
  type ReturnDelivery,
} from 'shared-ui';

type OrientStatus =
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
  selector: 'lv-level-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
  templateUrl: './level.page.html',
  styleUrl: './level.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class LevelPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly modes = LEVEL_MODES;
  readonly status = signal<OrientStatus>('need-gesture');
  readonly errorDetail = signal<string | null>(null);
  readonly mode = signal<LevelMode>('level');
  readonly modeLocked = signal(false);
  readonly held = signal(false);
  readonly copyFlash = signal(false);
  readonly tareOffset = signal(0);
  readonly thresholdLabel = signal(2);
  readonly hasReturnUrl = signal(false);

  /** Raw live sample from sensors / manual. */
  private readonly liveSample = signal<OrientationSample | null>(null);
  /** Frozen sample when Hold is on. */
  private readonly heldSample = signal<OrientationSample | null>(null);

  readonly sample = computed(() => {
    const raw = this.held() ? this.heldSample() : this.liveSample();
    if (!raw) {
      return null;
    }
    return withInclineTare(raw, this.tareOffset());
  });

  readonly captured = signal<{ mode: LevelMode; value: string; sample: OrientationSample } | null>(
    null,
  );

  readonly copyValue = computed(() => this.captured()?.value ?? null);

  readonly liveValue = computed(() => {
    const s = this.sample();
    return s ? valueForMode(this.mode(), s) : null;
  });

  readonly primaryReadout = computed(() => {
    const s = this.sample();
    const mode = this.mode();
    if (!s) {
      return '—';
    }
    switch (mode) {
      case 'level': {
        if (s.pitch == null || s.roll == null) {
          return '—';
        }
        return `${roundOrient(levelDeviation(s.pitch, s.roll), 1)}°`;
      }
      case 'incline':
        return s.incline == null ? '—' : `${roundOrient(s.incline, 1)}°`;
    }
  });

  readonly secondaryReadout = computed(() => {
    const s = this.sample();
    const mode = this.mode();
    if (!s) {
      return '';
    }
    switch (mode) {
      case 'level':
        if (s.pitch == null || s.roll == null) {
          return '';
        }
        return `P ${roundOrient(s.pitch)}° · R ${roundOrient(s.roll)}°`;
      case 'incline':
        return this.tareOffset() !== 0 ? `tare ${roundOrient(this.tareOffset())}°` : 'from horizontal';
    }
  });

  readonly levelOk = computed(() => {
    const s = this.sample();
    if (!s || s.pitch == null || s.roll == null) {
      return false;
    }
    return isWithinLevelThreshold(s.pitch, s.roll, this.threshold);
  });

  readonly bubbleX = computed(() => {
    const roll = this.sample()?.roll ?? 0;
    return Math.max(-42, Math.min(42, roll * (28 / Math.max(this.threshold, 0.5))));
  });

  readonly bubbleY = computed(() => {
    const pitch = this.sample()?.pitch ?? 0;
    return Math.max(-42, Math.min(42, pitch * (28 / Math.max(this.threshold, 0.5))));
  });

  readonly inclineNeedle = computed(() => {
    const incline = this.sample()?.incline ?? 0;
    return Math.max(-90, Math.min(90, incline));
  });

  readonly canConfirm = computed(() => {
    if (this.liveValue() == null) {
      return false;
    }
    if (this.requireLevel && this.mode() === 'level' && !this.levelOk()) {
      return false;
    }
    return true;
  });

  readonly confirmLabel = computed(() =>
    this.hasReturnUrl() ? 'Use reading' : 'Capture reading',
  );

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private threshold = 2;
  private requireLevel = false;
  private listening = false;
  private wasLevelOk = false;
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
    this.threshold = parseThreshold(params.get('threshold'), 2);
    this.thresholdLabel.set(this.threshold);
    this.requireLevel = parseFlag(params.get('requireLevel'));

    const locked = parseOrientMode(params.get('mode'));
    if (locked === 'compass' && location.pathname.includes('/level')) {
      const next = new URL(location.href.replace(/\/level(\/|$)/, '/compass$1'));
      next.searchParams.delete('mode');
      location.replace(next.toString());
      return;
    }
    const levelMode = parseLevelMode(params.get('mode'));
    if (levelMode) {
      this.mode.set(levelMode);
      this.modeLocked.set(true);
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
      this.hasReturnUrl.set(true);
    }

    document.addEventListener('visibilitychange', this.onVisibility);

    if (!this.deviceOrientationSupported()) {
      this.useManual();
      return;
    }

    // iOS requires a user gesture for permission — show enable CTA when needed.
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

  setMode(next: LevelMode): void {
    if (this.modeLocked()) {
      return;
    }
    this.mode.set(next);
    this.held.set(false);
    this.heldSample.set(null);
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

  tareIncline(): void {
    const raw = this.held() ? this.heldSample() : this.liveSample();
    if (!raw || raw.incline == null) {
      return;
    }
    // Tare against raw incline so display becomes ~0.
    this.tareOffset.set(raw.incline);
  }

  clearTare(): void {
    this.tareOffset.set(0);
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
    this.patchManual({ heading: Number((event.target as HTMLInputElement).value) });
  }

  onManualPitch(event: Event): void {
    this.patchManual({ pitch: Number((event.target as HTMLInputElement).value) });
  }

  onManualRoll(event: Event): void {
    this.patchManual({ roll: Number((event.target as HTMLInputElement).value) });
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
    if (!current) {
      return;
    }
    const mode = this.mode();
    const value = valueForMode(mode, current);
    if (value == null) {
      this.errorDetail.set('No reading available yet.');
      return;
    }
    if (this.requireLevel && mode === 'level' && !this.levelOk()) {
      this.errorDetail.set(`Hold within ±${this.threshold}° of level to confirm.`);
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.stopSensors();
      void this.releaseWakeLock();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        this.buildReturnParams(mode, value, current),
        this.delivery,
      );
      return;
    }

    this.captured.set({ mode, value, sample: current });
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

  private patchManual(partial: Partial<OrientationSample>): void {
    if (this.held()) {
      this.held.set(false);
      this.heldSample.set(null);
    }
    const base = this.liveSample() ?? {
      heading: 0,
      pitch: 0,
      roll: 0,
      incline: 0,
      absolute: false,
    };
    const next: OrientationSample = {
      ...base,
      ...partial,
    };
    if (next.pitch != null && next.roll != null) {
      next.incline = sampleFromDeviceOrientation({
        alpha: next.heading == null ? null : (360 - next.heading) % 360,
        beta: next.pitch,
        gamma: next.roll,
        absolute: false,
      }).incline;
    }
    if (partial.heading != null && Number.isFinite(partial.heading)) {
      next.heading = ((partial.heading % 360) + 360) % 360;
    }
    this.liveSample.set(next);
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
    this.maybeHapticLevel(next);
  }

  private maybeHapticLevel(raw: OrientationSample): void {
    if (this.mode() !== 'level' || raw.pitch == null || raw.roll == null) {
      this.wasLevelOk = false;
      return;
    }
    const ok = isWithinLevelThreshold(raw.pitch, raw.roll, this.threshold);
    if (ok && !this.wasLevelOk && typeof navigator.vibrate === 'function') {
      navigator.vibrate(40);
    }
    this.wasLevelOk = ok;
  }

  private ensureManualSample(): void {
    const current = this.liveSample();
    if (this.hasUsefulSample(current) && current) {
      this.liveSample.set({
        heading: current.heading ?? 0,
        pitch: current.pitch ?? 0,
        roll: current.roll ?? 0,
        incline: current.incline ?? 0,
        absolute: false,
      });
      return;
    }
    this.liveSample.set({
      heading: 0,
      pitch: 0,
      roll: 0,
      incline: 0,
      absolute: false,
    });
  }

  private hasUsefulSample(sample: OrientationSample | null): boolean {
    if (!sample) {
      return false;
    }
    return sample.heading != null || sample.pitch != null || sample.roll != null;
  }

  private buildReturnParams(
    mode: LevelMode,
    value: string,
    sample: OrientationSample,
  ): Record<string, string | null | undefined> {
    const params: Record<string, string | null | undefined> = {
      value,
      format: formatForMode(mode),
      state: this.state,
      mode,
    };
    if (sample.heading != null) {
      params['heading'] = String(roundOrient(sample.heading));
    }
    if (sample.pitch != null) {
      params['pitch'] = String(roundOrient(sample.pitch));
    }
    if (sample.roll != null) {
      params['roll'] = String(roundOrient(sample.roll));
    }
    if (sample.incline != null) {
      params['incline'] = String(roundOrient(sample.incline));
    }
    if (this.tareOffset() !== 0) {
      params['tare'] = String(roundOrient(this.tareOffset()));
    }
    if (mode === 'level' && sample.pitch != null && sample.roll != null) {
      params['withinThreshold'] = String(
        isWithinLevelThreshold(sample.pitch, sample.roll, this.threshold),
      );
      params['threshold'] = String(this.threshold);
      params['deviation'] = String(roundOrient(levelDeviation(sample.pitch, sample.roll)));
    }
    return params;
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
      /* ignore — not critical for the tool */
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
