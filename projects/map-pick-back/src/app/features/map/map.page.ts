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
import * as L from 'leaflet';
import { ReturnUrlValidator, RbPanel, type ReturnDelivery } from 'shared-ui';

type MapStatus = 'ready' | 'invalid-return-url' | 'empty' | 'done' | 'redirecting';

type MapPick = {
  lat: number;
  lng: number;
  zoom: number;
};

const DEFAULT_CENTER: L.LatLngExpression = [59.9139, 10.7522];
const DEFAULT_ZOOM = 12;

/** Parse a query param as a number; missing/blank → NaN (unlike Number(null) === 0). */
function parseOptionalNumber(raw: string | null): number {
  if (raw == null || raw.trim() === '') {
    return Number.NaN;
  }
  return Number(raw);
}

function leafletAsset(file: string): string {
  const base = document.querySelector('base')?.href ?? `${location.origin}/`;
  return new URL(`assets/leaflet/${file}`, base).toString();
}

@Component({
  selector: 'mp-map-page',
  imports: [RouterLink, RbPanel],
  templateUrl: './map.page.html',
  styleUrl: './map.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class MapPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');

  readonly status = signal<MapStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly pick = signal<MapPick | null>(null);

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private initialCenter: L.LatLngExpression = DEFAULT_CENTER;
  private initialZoom = DEFAULT_ZOOM;
  private hasQueryCenter = false;
  private ready = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bootstrap();
    });
  }

  ngOnDestroy(): void {
    this.teardownMap();
  }

  onCancel(): void {
    this.teardownMap();
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

  onClear(): void {
    this.marker?.remove();
    this.marker = null;
    this.pick.set(null);
    if (this.status() === 'empty' || this.status() === 'done') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onDone(): void {
    const pick = this.pick();
    if (!pick) {
      this.status.set('empty');
      this.errorDetail.set('Tap the map to place a pin first.');
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.teardownMap();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        {
          value: `${pick.lat},${pick.lng}`,
          format: 'map.point',
          state: this.state,
          lat: String(pick.lat),
          lng: String(pick.lng),
          zoom: String(pick.zoom),
        },
        this.delivery,
      );
      return;
    }

    this.teardownMap();
    this.status.set('done');
  }

  pickAgain(): void {
    this.status.set('ready');
    this.errorDetail.set(null);
    requestAnimationFrame(() => this.initMap());
  }

  useMyLocation(): void {
    this.centerOnUserLocation({ placePin: true, reportErrors: true });
  }

  private bootstrap(): void {
    const params = this.route.snapshot.queryParamMap;

    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

    const lat = parseOptionalNumber(params.get('lat'));
    const lng = parseOptionalNumber(params.get('lng'));
    const zoom = parseOptionalNumber(params.get('zoom'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.initialCenter = [lat, lng];
      this.hasQueryCenter = true;
    }
    if (Number.isFinite(zoom) && zoom > 0) {
      this.initialZoom = zoom;
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

    this.initMap();
  }

  private initMap(): void {
    if (!this.ready) {
      return;
    }
    const el = this.mapEl()?.nativeElement;
    if (!el) {
      requestAnimationFrame(() => this.initMap());
      return;
    }

    const icon = L.icon({
      iconUrl: leafletAsset('marker-icon.png'),
      iconRetinaUrl: leafletAsset('marker-icon-2x.png'),
      shadowUrl: leafletAsset('marker-shadow.png'),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.map = L.map(el, {
      center: this.initialCenter,
      zoom: this.initialZoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.placePin(event.latlng.lat, event.latlng.lng, icon);
    });

    const center = this.map.getCenter();
    if (this.hasQueryCenter) {
      this.placePin(center.lat, center.lng, icon);
    } else {
      // No lat/lng from the caller — start on the device location when available.
      this.centerOnUserLocation();
    }

    // Leaflet needs a size pass after layout, and whenever the shell resizes.
    requestAnimationFrame(() => this.map?.invalidateSize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(el);
    }
  }

  private centerOnUserLocation(options?: {
    placePin?: boolean;
    reportErrors?: boolean;
  }): void {
    if (!('geolocation' in navigator) || !this.map) {
      if (options?.reportErrors) {
        this.errorDetail.set('Could not read your current location.');
        this.status.set('empty');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!this.map) {
          return;
        }
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], Math.max(this.map.getZoom(), 14));
        if (options?.placePin) {
          this.placePin(latitude, longitude);
        }
      },
      () => {
        if (options?.reportErrors) {
          this.errorDetail.set('Could not read your current location.');
          this.status.set('empty');
        }
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  private placePin(lat: number, lng: number, icon?: L.Icon): void {
    if (!this.map) {
      return;
    }
    const markerIcon =
      icon ??
      L.icon({
        iconUrl: leafletAsset('marker-icon.png'),
        iconRetinaUrl: leafletAsset('marker-icon-2x.png'),
        shadowUrl: leafletAsset('marker-shadow.png'),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker?.getLatLng();
        if (!pos || !this.map) {
          return;
        }
        this.pick.set({
          lat: pos.lat,
          lng: pos.lng,
          zoom: this.map.getZoom(),
        });
      });
    }

    this.pick.set({
      lat,
      lng,
      zoom: this.map.getZoom(),
    });
    if (this.status() === 'empty') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  private teardownMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.marker?.remove();
    this.marker = null;
    this.map?.remove();
    this.map = null;
  }
}
