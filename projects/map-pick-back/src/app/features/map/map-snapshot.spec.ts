import { describe, expect, it } from 'vitest';
import { buildMeasurementSvg } from './map-snapshot';

describe('map-snapshot', () => {
  it('builds SVG for measure and area', () => {
    const points = [
      { lat: 59.91, lng: 10.75 },
      { lat: 59.92, lng: 10.76 },
      { lat: 59.915, lng: 10.77 },
    ];
    const measure = buildMeasurementSvg('measure', points);
    expect(measure).toContain('<svg');
    expect(measure).toContain('Distance measurement');
    expect(measure).toContain('Length');

    const area = buildMeasurementSvg('area', points);
    expect(area).toContain('Area measurement');
    expect(area).toContain('fill="rgba(74,163,199,0.28)"');
  });

  it('handles empty points', () => {
    const empty = buildMeasurementSvg('measure', []);
    expect(empty).toContain('No points yet');
  });
});
