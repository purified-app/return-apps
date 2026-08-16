/** Earth mean radius in meters (WGS84 approximation). */
export const EARTH_RADIUS_M = 6_371_008.8;

export type MapMode = 'pick' | 'measure' | 'area';

export type LatLngPoint = {
  lat: number;
  lng: number;
};

export const MAP_MODES: readonly MapMode[] = ['pick', 'measure', 'area'] as const;

export function parseMapMode(raw: string | null | undefined): MapMode | null {
  if (raw == null) {
    return null;
  }
  const value = raw.trim().toLowerCase();
  return MAP_MODES.includes(value as MapMode) ? (value as MapMode) : null;
}

export function formatForMode(mode: MapMode): string {
  switch (mode) {
    case 'pick':
      return 'map.point';
    case 'measure':
      return 'map.distance';
    case 'area':
      return 'map.area';
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two WGS84 points, in meters. */
export function haversineMeters(a: LatLngPoint, b: LatLngPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Per-segment lengths (meters) for a polyline of 2+ points. */
export function segmentLengthsMeters(points: readonly LatLngPoint[]): number[] {
  if (points.length < 2) {
    return [];
  }
  const lengths: number[] = [];
  for (let i = 1; i < points.length; i++) {
    lengths.push(haversineMeters(points[i - 1]!, points[i]!));
  }
  return lengths;
}

export function pathLengthMeters(points: readonly LatLngPoint[]): number {
  return segmentLengthsMeters(points).reduce((sum, n) => sum + n, 0);
}

/**
 * Spherical polygon area on a sphere (m²), using the surveyor's formula
 * adapted for lat/lng. Ring may be open; it is closed automatically.
 * Returns 0 for fewer than 3 distinct vertices.
 */
export function polygonAreaSquareMeters(points: readonly LatLngPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  const ring = closeRing(points);
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i]!;
    const p2 = ring[i + 1]!;
    total += toRad(p2.lng - p1.lng) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

export function polygonPerimeterMeters(points: readonly LatLngPoint[]): number {
  if (points.length < 2) {
    return 0;
  }
  const ring = closeRing(points);
  return pathLengthMeters(ring);
}

function closeRing(points: readonly LatLngPoint[]): LatLngPoint[] {
  if (points.length === 0) {
    return [];
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (first.lat === last.lat && first.lng === last.lng) {
    return [...points];
  }
  return [...points, first];
}

/** Encode points as `lat,lng;lat,lng;…` for return extras. */
export function encodePoints(points: readonly LatLngPoint[]): string {
  return points.map((p) => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join(';');
}

export function roundCoord(n: number, digits = 6): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Human-readable distance: m under 1 km, else km with adaptive precision. */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return '—';
  }
  if (meters < 1000) {
    return `${trimNumber(meters, meters < 100 ? 1 : 0)} m`;
  }
  const km = meters / 1000;
  return `${trimNumber(km, km < 10 ? 2 : km < 100 ? 1 : 0)} km`;
}

/** Human-readable area: m², then ha, then km². */
export function formatArea(squareMeters: number): string {
  if (!Number.isFinite(squareMeters) || squareMeters < 0) {
    return '—';
  }
  if (squareMeters < 10_000) {
    return `${trimNumber(squareMeters, squareMeters < 100 ? 1 : 0)} m²`;
  }
  if (squareMeters < 1_000_000) {
    const ha = squareMeters / 10_000;
    return `${trimNumber(ha, ha < 10 ? 2 : 1)} ha`;
  }
  const km2 = squareMeters / 1_000_000;
  return `${trimNumber(km2, km2 < 10 ? 2 : 1)} km²`;
}

function trimNumber(n: number, digits: number): string {
  return n.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export function modeTitle(mode: MapMode): string {
  switch (mode) {
    case 'pick':
      return 'Pick';
    case 'measure':
      return 'Measure';
    case 'area':
      return 'Area';
  }
}
