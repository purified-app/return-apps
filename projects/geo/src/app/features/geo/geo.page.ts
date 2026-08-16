import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@angular-libs/translate';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';
import { reverseGeocode } from './geo-reverse';

type GeoStatus =
  | 'idle'
  | 'locating'
  | 'invalid-return-url'
  | 'unsupported'
  | 'denied'
  | 'error'
  | 'done'
  | 'redirecting';

export type GeoReading = {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  label: string | null;
};

@Component({
  selector: 'gb-geo-page',
  imports: [RouterLink, RbPanel, RbResultActions, TranslatePipe],
  templateUrl: './geo.page.html',
  styleUrl: './geo.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class GeoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly status = signal<GeoStatus>('idle');
  readonly errorDetail = signal<string | null>(null);
  readonly reading = signal<GeoReading | null>(null);

  readonly copyValue = computed(() => {
    const r = this.reading();
    return r ? `${r.lat},${r.lng}` : null;
  });

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private highAccuracy = true;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

    const highAccuracyParam = params.get('highAccuracy');
    if (highAccuracyParam === '0' || highAccuracyParam === 'false') {
      this.highAccuracy = false;
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

    this.locate();
  }

  locate(): void {
    if (!('geolocation' in navigator)) {
      this.status.set('unsupported');
      this.errorDetail.set('Geolocation is not supported in this browser.');
      return;
    }

    this.status.set('locating');
    this.errorDetail.set(null);
    this.reading.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => void this.onSuccess(position),
      (error) => this.onError(error),
      {
        enableHighAccuracy: this.highAccuracy,
        timeout: 20_000,
        maximumAge: 0,
      },
    );
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

  onUseReading(): void {
    const reading = this.reading();
    if (!reading) {
      return;
    }
    this.returnReading(reading);
  }

  private async onSuccess(position: GeolocationPosition): Promise<void> {
    const { coords, timestamp } = position;
    const reading: GeoReading = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp,
      label: null,
    };
    this.reading.set(reading);

    const label = await reverseGeocode(reading.lat, reading.lng, {
      lang: typeof navigator !== 'undefined' ? navigator.language : undefined,
    });
    const withLabel = label ? { ...reading, label } : reading;
    this.reading.set(withLabel);

    if (this.returnUrl) {
      this.returnReading(withLabel);
      return;
    }

    this.status.set('done');
  }

  private returnReading(reading: GeoReading): void {
    const extras: Record<string, string | null | undefined> = {
      lat: String(reading.lat),
      lng: String(reading.lng),
      accuracy: String(reading.accuracy),
      timestamp: String(reading.timestamp),
    };
    if (reading.altitude != null) {
      extras['altitude'] = String(reading.altitude);
    }
    if (reading.altitudeAccuracy != null) {
      extras['altitudeAccuracy'] = String(reading.altitudeAccuracy);
    }
    if (reading.heading != null) {
      extras['heading'] = String(reading.heading);
    }
    if (reading.speed != null) {
      extras['speed'] = String(reading.speed);
    }
    if (reading.label) {
      extras['label'] = reading.label;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        {
          value: `${reading.lat},${reading.lng}`,
          format: 'geo.point',
          state: this.state,
          ...extras,
        },
        this.delivery,
      );
      return;
    }

    this.status.set('done');
  }

  private onError(error: GeolocationPositionError): void {
    if (error.code === error.PERMISSION_DENIED) {
      this.status.set('denied');
      this.errorDetail.set('Location permission was denied. Allow location access and try again.');
      return;
    }
    if (error.code === error.TIMEOUT) {
      this.status.set('error');
      this.errorDetail.set(error.message || 'Location timed out.');
      return;
    }
    this.status.set('error');
    this.errorDetail.set(error.message || 'Could not read location.');
  }
}
