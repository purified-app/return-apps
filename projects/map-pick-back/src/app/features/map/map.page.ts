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
import type * as L from 'leaflet';
import { ReturnUrlValidator, RbPanel, RbResultActions, downloadBlob, type ReturnDelivery } from 'shared-ui';
import {
  MAP_MODES,
  UNIT_SYSTEMS,
  encodePoints,
  formatArea,
  formatDistance,
  formatForMode,
  modeTitle,
  parseMapMode,
  parseUnitSystem,
  pathLengthMeters,
  polygonAreaSquareMeters,
  polygonPerimeterMeters,
  roundCoord,
  unitsTitle,
  type LatLngPoint,
  type MapMode,
  type UnitSystem,
} from './map-geo';
import { captureMapPng } from './map-snapshot';
import { MapSession } from './map-session';

type MapStatus = 'ready' | 'invalid-return-url' | 'incomplete' | 'done' | 'redirecting';

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

/** Parse a query param as a number; missing/blank → NaN (unlike Number(null) === 0). */
function parseOptionalNumber(raw: string | null): number {
  if (raw == null || raw.trim() === '') {
    return Number.NaN;
  }
  return Number(raw);
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
  readonly unitSystems = UNIT_SYSTEMS;
  readonly mode = signal<MapMode>('pick');
  readonly units = signal<UnitSystem>('metric');
  readonly modeLocked = signal(false);
  readonly status = signal<MapStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly pick = signal<MapPick | null>(null);
  readonly points = signal<LatLngPoint[]>([]);
  readonly captured = signal<CapturedResult | null>(null);
  readonly savingImage = signal(false);

  readonly modeTitle = modeTitle;
  readonly unitsTitle = unitsTitle;

  readonly pathMeters = computed(() => pathLengthMeters(this.points()));
  readonly areaSqMeters = computed(() => polygonAreaSquareMeters(this.points()));
  readonly perimeterMeters = computed(() => polygonPerimeterMeters(this.points()));

  readonly measureLabel = computed(() => {
    const pts = this.points();
    const units = this.units();
    if (pts.length === 0) {
      return 'Tap the map to add points, or start from your location.';
    }
    if (pts.length === 1) {
      return '1 point · tap to add the next';
    }
    return `${formatDistance(this.pathMeters(), units)} · ${pts.length} points`;
  });

  readonly areaLabel = computed(() => {
    const pts = this.points();
    const units = this.units();
    if (pts.length < 3) {
      return pts.length === 0
        ? 'Tap to place vertices (need 3+ for an area).'
        : `${pts.length} vertices · need ${3 - pts.length} more`;
    }
    return `${formatArea(this.areaSqMeters(), units)} · perimeter ${formatDistance(this.perimeterMeters(), units)}`;
  });

  readonly copyValue = computed(() => this.captured()?.value ?? null);

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
  private initialCenter: L.LatLngExpression = DEFAULT_CENTER;
  private initialZoom = DEFAULT_ZOOM;
  private hasQueryCenter = false;
  private ready = false;

  private readonly session = new MapSession({
    onMapClick: (lat, lng) => this.onMapClick(lat, lng),
    onPickDragEnd: (lat, lng, zoom) => {
      this.pick.set({ lat, lng, zoom });
    },
    onVertexMove: (index, lat, lng) => this.movePoint(index, lat, lng),
  });

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bootstrap();
    });
  }

  ngOnDestroy(): void {
    this.session.destroy();
  }

  setMode(next: MapMode): void {
    if (this.modeLocked() || this.mode() === next) {
      return;
    }
    this.clearGeometry();
    this.mode.set(next);
    this.errorDetail.set(null);
    if (this.status() === 'incomplete') {
      this.status.set('ready');
    }
    this.syncDraw();
  }

  setUnits(next: UnitSystem): void {
    if (this.units() === next) {
      return;
    }
    this.units.set(next);
    this.syncDraw();
  }

  onCancel(): void {
    this.session.destroy();
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
    this.syncDraw();
    if (this.status() === 'incomplete' || this.status() === 'done') {
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
    this.syncDraw();
    if (this.status() === 'incomplete') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onDone(): void {
    const mode = this.mode();
    if (!this.canDone()) {
      this.status.set('incomplete');
      this.errorDetail.set(this.doneHint(mode));
      return;
    }

    const result = this.buildResult(mode);
    if (!result) {
      this.status.set('incomplete');
      this.errorDetail.set(this.doneHint(mode));
      return;
    }

    if (this.returnUrl) {
      this.status.set('redirecting');
      this.session.destroy();
      location.href = this.returnUrlValidator.buildRedirectUrl(
        this.returnUrl,
        { ...result.extras, value: result.value, format: result.format, state: this.state },
        this.delivery,
      );
      return;
    }

    this.session.destroy();
    this.captured.set(result);
    this.status.set('done');
  }

  async onSaveImage(): Promise<void> {
    const mode = this.mode();
    const map = this.session.leaflet;
    if (mode === 'pick' || !this.canSaveImage() || !map || this.savingImage()) {
      return;
    }

    this.savingImage.set(true);
    this.errorDetail.set(null);
    try {
      const blob = await captureMapPng(map, mode, this.points(), {
        title: mode === 'measure' ? 'Distance measurement' : 'Area measurement',
        units: this.units(),
      });
      const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '');
      downloadBlob(blob, `map-${mode}-${stamp}.png`);
    } catch {
      this.errorDetail.set('Could not save the map image. Try again when tiles have finished loading.');
      this.status.set('incomplete');
    } finally {
      this.savingImage.set(false);
    }
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

    const units = parseUnitSystem(params.get('units'));
    if (units) {
      this.units.set(units);
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

    this.session.create(el, this.initialCenter, this.initialZoom);

    const center = this.session.center;
    if (!center) {
      return;
    }

    if (this.mode() === 'pick') {
      if (this.hasQueryCenter) {
        this.placePickPin(center.lat, center.lng);
      } else {
        this.centerOnUserLocation({ placePin: true });
      }
    } else if (this.hasQueryCenter) {
      // Non-pick modes: use lat/lng only as view center, not a vertex.
      this.session.setView(center.lat, center.lng);
    } else {
      this.centerOnUserLocation();
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
    if (this.status() === 'incomplete') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
    this.syncDraw();
  }

  private centerOnUserLocation(options?: {
    placePin?: boolean;
    reportErrors?: boolean;
    onSuccess?: (lat: number, lng: number) => void;
  }): void {
    if (!('geolocation' in navigator) || !this.session.leaflet) {
      if (options?.reportErrors) {
        this.errorDetail.set('Could not read your current location.');
        this.status.set('incomplete');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!this.session.leaflet) {
          return;
        }
        const { latitude, longitude } = position.coords;
        this.session.setView(latitude, longitude, Math.max(this.session.zoom, 14));
        if (options?.placePin) {
          this.placePickPin(latitude, longitude);
        }
        options?.onSuccess?.(latitude, longitude);
      },
      () => {
        if (options?.reportErrors) {
          this.errorDetail.set('Could not read your current location.');
          this.status.set('incomplete');
        }
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  private placePickPin(lat: number, lng: number): void {
    this.session.placePickPin(lat, lng);
    this.pick.set({
      lat,
      lng,
      zoom: this.session.zoom,
    });
    if (this.status() === 'incomplete') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  private syncDraw(): void {
    this.session.syncDraw({
      mode: this.mode(),
      points: this.points(),
      units: this.units(),
    });
  }

  private movePoint(index: number, lat: number, lng: number): void {
    this.points.update((pts) => {
      if (index < 0 || index >= pts.length) {
        return pts;
      }
      const next = pts.slice();
      next[index] = { lat, lng };
      return next;
    });
    this.session.syncPath({
      mode: this.mode(),
      points: this.points(),
      units: this.units(),
    });
  }

  private clearGeometry(): void {
    this.session.clearPickMarker();
    this.session.clearDrawLayers();
    this.pick.set(null);
    this.points.set([]);
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
        summary: formatDistance(meters, this.units()),
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
      summary: formatArea(area, this.units()),
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
}
