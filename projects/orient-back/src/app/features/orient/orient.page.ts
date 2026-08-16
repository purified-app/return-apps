import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';
import {
  ORIENT_MODES,
  type OrientMode,
  type OrientationSample,
  cardinalLabel,
  formatForMode,
  isWithinLevelThreshold,
  parseOrientMode,
  parseThreshold,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
} from './orient-math';

type OrientStatus =
  | 'need-permission'
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

@Component({
  selector: 'ob-orient-page',
  imports: [RouterLink, RbPanel, RbResultActions],
  templateUrl: './orient.page.html',
  styleUrl: './orient.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class OrientPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly modes = ORIENT_MODES;
  readonly status = signal<OrientStatus>('need-permission');
  readonly errorDetail = signal<string | null>(null);
  readonly mode = signal<OrientMode>('compass');
  readonly modeLocked = signal(false);
  readonly sample = signal<OrientationSample | null>(null);
  readonly captured = signal<{ mode: OrientMode; value: string; sample: OrientationSample } | null>(
    null,
  );

  readonly copyValue = computed(() => this.captured()?.value ?? null);

  readonly headingLabel = computed(() => {
    const heading = this.sample()?.heading;
    return heading == null ? '—' : `${roundOrient(heading)}° ${cardinalLabel(heading)}`;
  });

  readonly pitchLabel = computed(() => {
    const pitch = this.sample()?.pitch;
    return pitch == null ? '—' : `${roundOrient(pitch)}°`;
  });

  readonly rollLabel = computed(() => {
    const roll = this.sample()?.roll;
    return roll == null ? '—' : `${roundOrient(roll)}°`;
  });

  readonly inclineLabel = computed(() => {
    const incline = this.sample()?.incline;
    return incline == null ? '—' : `${roundOrient(incline)}°`;
  });

  readonly levelOk = computed(() => {
    const s = this.sample();
    if (!s || s.pitch == null || s.roll == null) {
      return false;
    }
    return isWithinLevelThreshold(s.pitch, s.roll, this.threshold);
  });

  readonly compassRotation = computed(() => {
    const heading = this.sample()?.heading;
    return heading == null ? 0 : -heading;
  });

  readonly bubbleX = computed(() => {
    const roll = this.sample()?.roll ?? 0;
    return Math.max(-40, Math.min(40, roll * 2.2));
  });

  readonly bubbleY = computed(() => {
    const pitch = this.sample()?.pitch ?? 0;
    return Math.max(-40, Math.min(40, pitch * 2.2));
  });

  readonly inclineNeedle = computed(() => {
    const incline = this.sample()?.incline ?? 0;
    return Math.max(-90, Math.min(90, incline));
  });

  readonly canConfirm = computed(() => {
    const s = this.sample();
    if (!s) {
      return false;
    }
    return valueForMode(this.mode(), s) != null;
  });

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private threshold = 2;
  private listening = false;
  private readonly onOrientation = (event: DeviceOrientationEvent) => this.handleOrientation(event);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');
    this.threshold = parseThreshold(params.get('threshold'), 2);

    const locked = parseOrientMode(params.get('mode'));
    if (locked) {
      this.mode.set(locked);
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
    }

    if (!this.deviceOrientationSupported()) {
      this.status.set('manual');
      this.sample.set({
        heading: 0,
        pitch: 0,
        roll: 0,
        incline: 0,
        absolute: false,
      });
      return;
    }

    void this.startSensors();
  }

  ngOnDestroy(): void {
    this.stopSensors();
  }

  setMode(next: OrientMode): void {
    if (this.modeLocked()) {
      return;
    }
    this.mode.set(next);
  }

  async startSensors(): Promise<void> {
    this.errorDetail.set(null);

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

    // If nothing arrives shortly, fall back to manual controls (desktop / no sensor).
    window.setTimeout(() => {
      if (this.status() === 'listening' && !this.sample()) {
        this.stopSensors();
        this.status.set('manual');
        this.sample.set({
          heading: 0,
          pitch: 0,
          roll: 0,
          incline: 0,
          absolute: false,
        });
      }
    }, 1500);
  }

  useManual(): void {
    this.stopSensors();
    this.status.set('manual');
    if (!this.sample()) {
      this.sample.set({
        heading: 0,
        pitch: 0,
        roll: 0,
        incline: 0,
        absolute: false,
      });
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

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.stopSensors();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        this.buildReturnParams(mode, value, current),
        this.delivery,
      );
      return;
    }

    this.captured.set({ mode, value, sample: current });
    this.stopSensors();
    this.status.set('done');
  }

  retry(): void {
    this.captured.set(null);
    this.errorDetail.set(null);
    if (!this.deviceOrientationSupported()) {
      this.useManual();
      return;
    }
    void this.startSensors();
  }

  modeTitle(mode: OrientMode): string {
    switch (mode) {
      case 'compass':
        return 'Compass';
      case 'level':
        return 'Level';
      case 'incline':
        return 'Incline';
    }
  }

  private patchManual(partial: Partial<OrientationSample>): void {
    const base = this.sample() ?? {
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
    this.sample.set(next);
  }

  private handleOrientation(event: DeviceOrientationEvent): void {
    const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
      .webkitCompassHeading;
    this.sample.set(
      sampleFromDeviceOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
        webkitCompassHeading: webkitHeading,
      }),
    );
  }

  private buildReturnParams(
    mode: OrientMode,
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
    if (mode === 'level' && sample.pitch != null && sample.roll != null) {
      params['withinThreshold'] = String(
        isWithinLevelThreshold(sample.pitch, sample.roll, this.threshold),
      );
      params['threshold'] = String(this.threshold);
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
}
