import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnSession, ReturnUrlValidator, RbPanel } from 'shared-ui';

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

  private session!: ReturnSession;
  private highAccuracy = true;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const highAccuracyParam = params.get('highAccuracy');
    if (highAccuracyParam === '0' || highAccuracyParam === 'false') {
      this.highAccuracy = false;
    }

    const init = ReturnSession.open(this.returnUrlValidator, params, { delivery: 'query' });
    this.session = init.session;
    if (!init.ok) {
      this.status.set('invalid-return-url');
      this.errorDetail.set(init.reason);
      return;
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
    if (this.session.cancel()) {
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

    if (this.session.isReturnMode) {
      this.returnReading(reading);
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

    if (
      this.session.succeed(`${reading.lat},${reading.lng}`, 'geo.point', extras)
    ) {
      this.status.set('redirecting');
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
