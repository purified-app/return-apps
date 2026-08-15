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
import { ReturnUrlValidator, RbPanel } from 'shared-ui';

type MapStatus = 'ready' | 'invalid-return-url' | 'empty' | 'done' | 'redirecting';

type MapPick = {
  lat: number;
  lng: number;
  zoom: number;
};

const DEFAULT_CENTER: L.LatLngExpression = [59.9139, 10.7522];
const DEFAULT_ZOOM = 12;

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
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private initialCenter: L.LatLngExpression = DEFAULT_CENTER;
  private initialZoom = DEFAULT_ZOOM;
  private ready = false;

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
      location.href = this.returnUrlValidator.buildRedirectUrl(this.returnUrl, {
        lat: String(pick.lat),
        lng: String(pick.lng),
        zoom: String(pick.zoom),
        format: 'map-pin',
        state: this.state,
      });
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
    if (!('geolocation' in navigator) || !this.map) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.map?.setView([latitude, longitude], Math.max(this.map.getZoom(), 14));
        this.placePin(latitude, longitude);
      },
      () => {
        this.errorDetail.set('Could not read your current location.');
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  private bootstrap(): void {
    const params = this.route.snapshot.queryParamMap;
    this.state = params.get('state');

    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    const zoom = Number(params.get('zoom'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.initialCenter = [lat, lng];
    }
    if (Number.isFinite(zoom) && zoom > 0) {
      this.initialZoom = zoom;
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
    if (Number.isFinite(Number(this.route.snapshot.queryParamMap.get('lat')))) {
      this.placePin(center.lat, center.lng, icon);
    }

    // Leaflet needs a size pass after layout.
    requestAnimationFrame(() => this.map?.invalidateSize());
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
    this.marker?.remove();
    this.marker = null;
    this.map?.remove();
    this.map = null;
  }
}
