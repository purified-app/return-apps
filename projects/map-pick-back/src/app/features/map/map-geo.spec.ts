import { describe, expect, it } from 'vitest';
import {
  encodePoints,
  formatArea,
  formatDistance,
  formatForMode,
  haversineMeters,
  parseMapMode,
  pathLengthMeters,
  polygonAreaSquareMeters,
  polygonPerimeterMeters,
  segmentLengthsMeters,
} from './map-geo';

describe('map-geo', () => {
  it('parses modes and formats', () => {
    expect(parseMapMode('measure')).toBe('measure');
    expect(parseMapMode('AREA')).toBe('area');
    expect(parseMapMode('nope')).toBeNull();
    expect(formatForMode('pick')).toBe('map.point');
    expect(formatForMode('measure')).toBe('map.distance');
    expect(formatForMode('area')).toBe('map.area');
  });

  it('computes haversine and path length', () => {
    // ~111.2 km between 0°N,0°E and 1°N,0°E
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_500);

    const Oslo = { lat: 59.9139, lng: 10.7522 };
    const Bergen = { lat: 60.3913, lng: 5.3221 };
    const path = pathLengthMeters([Oslo, Bergen]);
    expect(path).toBeGreaterThan(280_000);
    expect(path).toBeLessThan(340_000);

    expect(segmentLengthsMeters([Oslo])).toEqual([]);
    expect(segmentLengthsMeters([Oslo, Bergen])).toHaveLength(1);
  });

  it('computes polygon area and perimeter', () => {
    // Rough 1°×1° square near equator ≈ 12_300 km²
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
      { lat: 1, lng: 0 },
    ];
    const area = polygonAreaSquareMeters(square);
    expect(area).toBeGreaterThan(12_000_000_000);
    expect(area).toBeLessThan(12_500_000_000);

    const peri = polygonPerimeterMeters(square);
    expect(peri).toBeGreaterThan(440_000);
    expect(peri).toBeLessThan(450_000);

    expect(polygonAreaSquareMeters(square.slice(0, 2))).toBe(0);
  });

  it('formats distance, area, and encodes points', () => {
    expect(formatDistance(42.4)).toBe('42.4 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatArea(500)).toBe('500 m²');
    expect(formatArea(25_000)).toBe('2.5 ha');
    expect(formatArea(2_500_000)).toBe('2.5 km²');
    expect(encodePoints([{ lat: 59.9139123, lng: 10.7522123 }])).toBe('59.913912,10.752212');
  });
});
