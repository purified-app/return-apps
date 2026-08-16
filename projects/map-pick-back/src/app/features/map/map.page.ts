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
import * as L from 'leaflet';
import { ReturnUrlValidator, RbPanel, RbResultActions, type ReturnDelivery } from 'shared-ui';
import {
  MAP_MODES,
  encodePoints,
  formatArea,
  formatDistance,
  formatForMode,
  modeTitle,
  parseMapMode,
  pathLengthMeters,
  polygonAreaSquareMeters,
  polygonPerimeterMeters,
  roundCoord,
  segmentLengthsMeters,
  type LatLngPoint,
  type MapMode,
} from './map-geo';
import { buildMeasurementSvg, downloadSvg } from './map-snapshot';

type MapStatus = 'ready' | 'invalid-return-url' | 'empty' | 'done' | 'redirecting';

type MapPick = {
  lat: number;
  lng: number;
  zoom: number;
};

type CapturedResult = {
  mode: MapMode;
  value: string;
  format: string;
  summary: string;
  extras: Record<string, string>;
};

const DEFAULT_CENTER: L.LatLngExpression = [59.9139, 10.7522];
const DEFAULT_ZOOM = 12;

const LINE_STYLE: L.PolylineOptions = {
  color: '#4aa3c7',
  weight: 3,
  opacity: 0.95,
  lineCap: 'round',
  lineJoin: 'round',
};

const AREA_STYLE: L.PolylineOptions = {
  ...LINE_STYLE,
  fillColor: '#4aa3c7',
  fillOpacity: 0.22,
};

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
  imports: [RouterLink, RbPanel, RbResultActions],
  templateUrl: './map.page.html',
  styleUrl: './map.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class MapPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');

  readonly modes = MAP_MODES;
  readonly mode = signal<MapMode>('pick');
  readonly modeLocked = signal(false);
  readonly status = signal<MapStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly pick = signal<MapPick | null>(null);
  readonly points = signal<LatLngPoint[]>([]);
  readonly captured = signal<CapturedResult | null>(null);

  readonly modeTitle = modeTitle;

  readonly pathMeters = computed(() => pathLengthMeters(this.points()));
  readonly areaSqMeters = computed(() => polygonAreaSquareMeters(this.points()));
  readonly perimeterMeters = computed(() => polygonPerimeterMeters(this.points()));

  readonly measureLabel = computed(() => {
    const pts = this.points();
    if (pts.length === 0) {
      return 'Tap the map to add points, or start from your location.';
    }
    if (pts.length === 1) {
      return '1 point · tap to add the next';
    }
    return `${formatDistance(this.pathMeters())} · ${pts.length} points`;
  });

  readonly areaLabel = computed(() => {
    const pts = this.points();
    if (pts.length < 3) {
      return pts.length === 0
        ? 'Tap to place vertices (need 3+ for an area).'
        : `${pts.length} vertices · need ${3 - pts.length} more`;
    }
    return `${formatArea(this.areaSqMeters())} · perimeter ${formatDistance(this.perimeterMeters())}`;
  });

  readonly copyValue = computed(() => this.captured()?.value ?? this.pickCoords() ?? null);

  readonly canSaveImage = computed(() => {
    const mode = this.mode();
    const n = this.points().length;
    return (mode === 'measure' && n >= 2) || (mode === 'area' && n >= 3);
  });

  readonly canDone = computed(() => {
    switch (this.mode()) {
      case 'pick':
        return this.pick() != null;
      case 'measure':
        return this.points().length >= 2;
      case 'area':
        return this.points().length >= 3;
    }
  });

  private returnUrl: URL | null = null;
  private state: string | null = null;
  private delivery: ReturnDelivery = 'query';
  private map: L.Map | null = null;
  private pickMarker: L.Marker | null = null;
  private drawLayer: L.LayerGroup | null = null;
  private initialCenter: L.LatLngExpression = DEFAULT_CENTER;
  private initialZoom = DEFAULT_ZOOM;
  private hasQueryCenter = false;
  private ready = false;
  private resizeObserver: ResizeObserver | null = null;
  private pickIcon: L.Icon | null = null;

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bootstrap();
    });
  }

  ngOnDestroy(): void {
    this.teardownMap();
  }

  setMode(next: MapMode): void {
    if (this.modeLocked() || this.mode() === next) {
      return;
    }
    this.clearGeometry();
    this.mode.set(next);
    this.errorDetail.set(null);
    if (this.status() === 'empty') {
      this.status.set('ready');
    }
    this.syncDrawLayer();
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
    this.clearGeometry();
    this.syncDrawLayer();
    if (this.status() === 'empty' || this.status() === 'done') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onUndo(): void {
    if (this.mode() === 'pick') {
      this.onClear();
      return;
    }
    this.points.update((pts) => pts.slice(0, -1));
    this.syncDrawLayer();
    if (this.status() === 'empty') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onDone(): void {
    const mode = this.mode();
    if (!this.canDone()) {
      this.status.set('empty');
      this.errorDetail.set(this.doneHint(mode));
      return;
    }

    const result = this.buildResult(mode);
    if (!result) {
      this.status.set('empty');
      this.errorDetail.set(this.doneHint(mode));
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.teardownMap();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        { ...result.extras, value: result.value, format: result.format, state: this.state },
        this.delivery,
      );
      return;
    }

    this.teardownMap();
    this.captured.set(result);
    this.status.set('done');
  }

  onSaveImage(): void {
    const mode = this.mode();
    if (mode === 'pick' || !this.canSaveImage()) {
      return;
    }
    const svg = buildMeasurementSvg(mode, this.points(), {
      title: mode === 'measure' ? 'Distance measurement' : 'Area measurement',
    });
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '');
    downloadSvg(`map-${mode}-${stamp}.svg`, svg);
  }

  pickAgain(): void {
    this.captured.set(null);
    this.status.set('ready');
    this.errorDetail.set(null);
    requestAnimationFrame(() => this.initMap());
  }

  useMyLocation(): void {
    const mode = this.mode();
    if (mode === 'pick') {
      this.centerOnUserLocation({ placePin: true, reportErrors: true });
      return;
    }
    this.centerOnUserLocation({
      reportErrors: true,
      onSuccess: (lat, lng) => {
        this.appendPoint(lat, lng);
      },
    });
  }

  private bootstrap(): void {
    const params = this.route.snapshot.queryParamMap;

    this.state = params.get('state');
    this.delivery = this.returnUrlValidator.parseDelivery(params.get('delivery'), 'query');

    const locked = parseMapMode(params.get('mode'));
    if (locked) {
      this.mode.set(locked);
      this.modeLocked.set(true);
    }

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

    this.pickIcon = L.icon({
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

    this.drawLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.onMapClick(event.latlng.lat, event.latlng.lng);
    });

    const center = this.map.getCenter();
    if (this.mode() === 'pick') {
      if (this.hasQueryCenter) {
        this.placePickPin(center.lat, center.lng);
      } else {
        this.centerOnUserLocation({ placePin: true });
      }
    } else if (this.hasQueryCenter) {
      // Non-pick modes: use lat/lng only as view center, not a vertex.
      this.map.setView([center.lat, center.lng], this.map.getZoom());
    } else {
      this.centerOnUserLocation();
    }

    requestAnimationFrame(() => this.map?.invalidateSize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(el);
    }
  }

  private onMapClick(lat: number, lng: number): void {
    if (this.status() === 'redirecting') {
      return;
    }
    if (this.mode() === 'pick') {
      this.placePickPin(lat, lng);
      return;
    }
    this.appendPoint(lat, lng);
  }

  private appendPoint(lat: number, lng: number): void {
    this.points.update((pts) => [...pts, { lat, lng }]);
    if (this.status() === 'empty') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
    this.syncDrawLayer();
  }

  private centerOnUserLocation(options?: {
    placePin?: boolean;
    reportErrors?: boolean;
    onSuccess?: (lat: number, lng: number) => void;
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
          this.placePickPin(latitude, longitude);
        }
        options?.onSuccess?.(latitude, longitude);
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

  private placePickPin(lat: number, lng: number): void {
    if (!this.map || !this.pickIcon) {
      return;
    }

    if (this.pickMarker) {
      this.pickMarker.setLatLng([lat, lng]);
    } else {
      this.pickMarker = L.marker([lat, lng], {
        icon: this.pickIcon,
        draggable: true,
      }).addTo(this.map);
      this.pickMarker.on('dragend', () => {
        const pos = this.pickMarker?.getLatLng();
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

  private syncDrawLayer(): void {
    if (!this.map || !this.drawLayer) {
      return;
    }
    this.drawLayer.clearLayers();

    if (this.mode() === 'pick') {
      return;
    }

    const pts = this.points();
    if (pts.length === 0) {
      return;
    }

    const latLngs: L.LatLngExpression[] = pts.map((p) => [p.lat, p.lng]);

    if (this.mode() === 'measure' && pts.length >= 2) {
      L.polyline(latLngs, LINE_STYLE).addTo(this.drawLayer);
      this.addSegmentLabels(pts);
    }

    if (this.mode() === 'area' && pts.length >= 2) {
      if (pts.length >= 3) {
        L.polygon(latLngs, AREA_STYLE).addTo(this.drawLayer);
      } else {
        L.polyline(latLngs, LINE_STYLE).addTo(this.drawLayer);
      }
    }

    pts.forEach((p, index) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: '#10151a',
        weight: 2,
        fillColor: '#e8edf2',
        fillOpacity: 1,
      })
        .bindTooltip(String(index + 1), {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'mp-vertex-label',
        })
        .addTo(this.drawLayer!);
    });
  }

  private addSegmentLabels(pts: readonly LatLngPoint[]): void {
    if (!this.drawLayer) {
      return;
    }
    const lengths = segmentLengthsMeters(pts);
    for (let i = 0; i < lengths.length; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const mid: L.LatLngExpression = [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
      L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'mp-segment-label',
      })
        .setContent(formatDistance(lengths[i]!))
        .setLatLng(mid)
        .addTo(this.drawLayer);
    }
  }

  private clearGeometry(): void {
    this.pickMarker?.remove();
    this.pickMarker = null;
    this.pick.set(null);
    this.points.set([]);
    this.drawLayer?.clearLayers();
  }

  private buildResult(mode: MapMode): CapturedResult | null {
    if (mode === 'pick') {
      const pick = this.pick();
      if (!pick) {
        return null;
      }
      const value = `${pick.lat},${pick.lng}`;
      return {
        mode,
        value,
        format: formatForMode(mode),
        summary: `${roundCoord(pick.lat)}, ${roundCoord(pick.lng)} · zoom ${pick.zoom}`,
        extras: {
          lat: String(pick.lat),
          lng: String(pick.lng),
          zoom: String(pick.zoom),
        },
      };
    }

    const pts = this.points();
    if (mode === 'measure') {
      if (pts.length < 2) {
        return null;
      }
      const meters = pathLengthMeters(pts);
      const value = String(roundCoord(meters, 2));
      return {
        mode,
        value,
        format: formatForMode(mode),
        summary: formatDistance(meters),
        extras: {
          mode,
          meters: value,
          points: encodePoints(pts),
          pointCount: String(pts.length),
        },
      };
    }

    if (pts.length < 3) {
      return null;
    }
    const area = polygonAreaSquareMeters(pts);
    const value = String(roundCoord(area, 2));
    return {
      mode,
      value,
      format: formatForMode(mode),
      summary: formatArea(area),
      extras: {
        mode,
        squareMeters: value,
        perimeterMeters: String(roundCoord(polygonPerimeterMeters(pts), 2)),
        points: encodePoints(pts),
        pointCount: String(pts.length),
      },
    };
  }

  private doneHint(mode: MapMode): string {
    switch (mode) {
      case 'pick':
        return 'Tap the map to place a pin first.';
      case 'measure':
        return 'Add at least two points to measure a distance.';
      case 'area':
        return 'Add at least three points to measure an area.';
    }
  }

  private pickCoords(): string | null {
    const p = this.pick();
    return p ? `${p.lat},${p.lng}` : null;
  }

  private teardownMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.pickMarker?.remove();
    this.pickMarker = null;
    this.drawLayer?.clearLayers();
    this.drawLayer = null;
    this.map?.remove();
    this.map = null;
  }
}
