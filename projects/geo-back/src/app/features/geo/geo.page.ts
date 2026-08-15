import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnUrlValidator, RbPanel } from 'shared-ui';

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
};

@Component({
  selector: 'gb-geo-page',
  imports: [RouterLink, RbPanel],
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

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private highAccuracy = true;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');
    const highAccuracyParam = params.get('highAccuracy');
    if (highAccuracyParam === '0' || highAccuracyParam === 'false') {
      this.highAccuracy = false;
    }

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
      (position) => this.onSuccess(position),
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
    void this.router.navigateByUrl('/home');
  }

  onUseReading(): void {
    const reading = this.reading();
    if (!reading) {
      return;
    }
    this.returnReading(reading);
  }

  private onSuccess(position: GeolocationPosition): void {
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
    };
    this.reading.set(reading);

    if (this.returnUrl) {
      this.returnReading(reading);
      return;
    }

    this.status.set('done');
  }

  private returnReading(reading: GeoReading): void {
    if (!this.returnUrl) {
      this.status.set('done');
      return;
    }

    this.status.set('redirecting');
    const params: Record<string, string | null | undefined> = {
      lat: String(reading.lat),
      lng: String(reading.lng),
      accuracy: String(reading.accuracy),
      timestamp: String(reading.timestamp),
      format: 'geo',
      state: this.state,
    };
    if (reading.altitude != null) {
      params['altitude'] = String(reading.altitude);
    }
    if (reading.altitudeAccuracy != null) {
      params['altitudeAccuracy'] = String(reading.altitudeAccuracy);
    }
    if (reading.heading != null) {
      params['heading'] = String(reading.heading);
    }
    if (reading.speed != null) {
      params['speed'] = String(reading.speed);
    }

    location.href = this.returnUrlValidator.buildRedirectUrl(this.returnUrl, params);
  }

  private onError(error: GeolocationPositionError): void {
    if (error.code === error.PERMISSION_DENIED) {
      this.status.set('denied');
      this.errorDetail.set('Location permission was denied. Allow location access and try again.');
      return;
    }
    this.status.set('error');
    this.errorDetail.set(error.message || 'Could not read location.');
  }
}
