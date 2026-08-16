import * as L from 'leaflet';
import {
  MAP_STROKE,
  formatArea,
  formatDistance,
  polygonAreaSquareMeters,
  polygonLabelPoint,
  segmentLengthsMeters,
  type LatLngPoint,
  type MapMode,
  type UnitSystem,
} from './map-geo';

const LINE_STYLE: L.PolylineOptions = {
  color: MAP_STROKE,
  weight: 3,
  opacity: 0.95,
  lineCap: 'round',
  lineJoin: 'round',
};

const AREA_STYLE: L.PolylineOptions = {
  ...LINE_STYLE,
  fillColor: MAP_STROKE,
  fillOpacity: 0.22,
};

export type MapDrawState = {
  mode: MapMode;
  points: readonly LatLngPoint[];
  units: UnitSystem;
};

export type MapSessionHandlers = {
  onMapClick: (lat: number, lng: number) => void;
  onPickDragEnd: (lat: number, lng: number, zoom: number) => void;
  onVertexMove: (index: number, lat: number, lng: number) => void;
};

function leafletAsset(file: string): string {
  const base = document.querySelector('base')?.href ?? `${location.origin}/`;
  return new URL(`assets/leaflet/${file}`, base).toString();
}

function vertexDivIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: 'mp-vertex',
    html:
      `<span class="mp-vertex__hit" aria-hidden="true"></span>` +
      `<span class="mp-vertex__dot" aria-hidden="true"></span>` +
      `<span class="mp-vertex__n">${index + 1}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

/** Owns the Leaflet map instance, pick marker, and measure/area draw layers. */
export class MapSession {
  private map: L.Map | null = null;
  private pickMarker: L.Marker | null = null;
  private pathLayer: L.LayerGroup | null = null;
  private vertexLayer: L.LayerGroup | null = null;
  private pickIcon: L.Icon | null = null;
  private resizeObserver: ResizeObserver | null = null;
  /** Suppress the map click that often follows a vertex drag on touch devices. */
  private suppressMapClick = false;
  private suppressClearTimer = 0;

  constructor(private readonly handlers: MapSessionHandlers) {}

  get leaflet(): L.Map | null {
    return this.map;
  }

  get zoom(): number {
    return this.map?.getZoom() ?? 0;
  }

  get center(): L.LatLng | null {
    return this.map?.getCenter() ?? null;
  }

  create(el: HTMLElement, center: L.LatLngExpression, zoom: number): void {
    this.destroy();

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
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      // Required so Save image can composite tiles onto a canvas (OSM tiles lack CORS).
      crossOrigin: true,
    }).addTo(this.map);

    this.pathLayer = L.layerGroup().addTo(this.map);
    this.vertexLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.suppressMapClick) {
        this.suppressMapClick = false;
        return;
      }
      this.handlers.onMapClick(event.latlng.lat, event.latlng.lng);
    });

    requestAnimationFrame(() => this.map?.invalidateSize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(el);
    }
  }

  destroy(): void {
    if (this.suppressClearTimer) {
      window.clearTimeout(this.suppressClearTimer);
      this.suppressClearTimer = 0;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearPickMarker();
    this.pathLayer?.clearLayers();
    this.pathLayer = null;
    this.vertexLayer?.clearLayers();
    this.vertexLayer = null;
    this.map?.remove();
    this.map = null;
    this.pickIcon = null;
    this.suppressMapClick = false;
  }

  setView(lat: number, lng: number, zoom?: number): void {
    if (!this.map) {
      return;
    }
    this.map.setView([lat, lng], zoom ?? this.map.getZoom());
  }

  placePickPin(lat: number, lng: number): void {
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
        this.handlers.onPickDragEnd(pos.lat, pos.lng, this.map.getZoom());
      });
    }
  }

  clearPickMarker(): void {
    this.pickMarker?.remove();
    this.pickMarker = null;
  }

  clearDrawLayers(): void {
    this.pathLayer?.clearLayers();
    this.vertexLayer?.clearLayers();
  }

  /** Full redraw of path + vertices (mode changes, undo, append). */
  syncDraw(state: MapDrawState): void {
    this.syncPath(state);
    this.syncVertices(state);
  }

  /** Path/labels only — used while dragging a vertex so markers are not rebuilt. */
  syncPath(state: MapDrawState): void {
    if (!this.map || !this.pathLayer) {
      return;
    }
    this.pathLayer.clearLayers();

    if (state.mode === 'pick') {
      return;
    }

    const pts = state.points;
    if (pts.length === 0) {
      return;
    }

    const latLngs: L.LatLngExpression[] = pts.map((p) => [p.lat, p.lng]);

    if (state.mode === 'measure' && pts.length >= 2) {
      L.polyline(latLngs, LINE_STYLE).addTo(this.pathLayer);
      this.addSegmentLabels(pts, state.units);
    }

    if (state.mode === 'area' && pts.length >= 2) {
      if (pts.length >= 3) {
        L.polygon(latLngs, AREA_STYLE).addTo(this.pathLayer);
        this.addAreaCenterLabel(pts, state.units);
      } else {
        L.polyline(latLngs, LINE_STYLE).addTo(this.pathLayer);
      }
    }
  }

  private syncVertices(state: MapDrawState): void {
    if (!this.map || !this.vertexLayer) {
      return;
    }
    this.vertexLayer.clearLayers();

    if (state.mode === 'pick') {
      return;
    }

    state.points.forEach((p, index) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: vertexDivIcon(index),
        draggable: true,
        autoPan: true,
        keyboard: true,
        title: `Point ${index + 1} (drag to move)`,
        alt: `Point ${index + 1}`,
        zIndexOffset: 500,
      }).addTo(this.vertexLayer!);

      marker.on('dragstart', () => {
        this.suppressMapClick = true;
        this.map?.dragging.disable();
      });

      marker.on('drag', () => {
        const pos = marker.getLatLng();
        this.handlers.onVertexMove(index, pos.lat, pos.lng);
      });

      marker.on('dragend', () => {
        this.map?.dragging.enable();
        const pos = marker.getLatLng();
        this.handlers.onVertexMove(index, pos.lat, pos.lng);
        // Touch browsers often emit a map click after dragend.
        this.suppressMapClick = true;
        if (this.suppressClearTimer) {
          window.clearTimeout(this.suppressClearTimer);
        }
        this.suppressClearTimer = window.setTimeout(() => {
          this.suppressMapClick = false;
          this.suppressClearTimer = 0;
        }, 300);
      });

      marker.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event);
      });
    });
  }

  private addSegmentLabels(pts: readonly LatLngPoint[], units: UnitSystem): void {
    if (!this.pathLayer) {
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
        .setContent(formatDistance(lengths[i]!, units))
        .setLatLng(mid)
        .addTo(this.pathLayer);
    }
  }

  private addAreaCenterLabel(pts: readonly LatLngPoint[], units: UnitSystem): void {
    if (!this.pathLayer) {
      return;
    }
    const center = polygonLabelPoint(pts);
    if (!center) {
      return;
    }
    const areaText = formatArea(polygonAreaSquareMeters(pts), units);
    L.tooltip({
      permanent: true,
      direction: 'center',
      className: 'mp-area-label',
    })
      .setContent(areaText)
      .setLatLng([center.lat, center.lng])
      .addTo(this.pathLayer);
  }
}
