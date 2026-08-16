import {
  cardinalLabel,
  compassHeadingFromEvent,
  formatForMode,
  inclineFromPitchRoll,
  isWithinLevelThreshold,
  normalizeHeading,
  parseOrientMode,
  parseThreshold,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
} from './orient-math';

describe('orient-math', () => {
  it('parses modes and thresholds', () => {
    expect(parseOrientMode('level')).toBe('level');
    expect(parseOrientMode('nope')).toBeNull();
    expect(parseThreshold('3.5')).toBe(3.5);
    expect(parseThreshold('-1')).toBe(2);
    expect(parseThreshold(null)).toBe(2);
  });

  it('normalizes headings and labels cardinals', () => {
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-10)).toBe(350);
    expect(cardinalLabel(0)).toBe('N');
    expect(cardinalLabel(90)).toBe('E');
    expect(cardinalLabel(180)).toBe('S');
  });

  it('prefers webkit compass heading', () => {
    expect(
      compassHeadingFromEvent({ alpha: 10, webkitCompassHeading: 42, absolute: true }),
    ).toBe(42);
    expect(compassHeadingFromEvent({ alpha: 90, absolute: true })).toBe(270);
  });

  it('computes incline and level threshold', () => {
    expect(roundOrient(inclineFromPitchRoll(0, 0))).toBe(0);
    expect(inclineFromPitchRoll(90, 0)).toBeGreaterThan(80);
    expect(isWithinLevelThreshold(0.5, -0.5, 2)).toBe(true);
    expect(isWithinLevelThreshold(3, 0, 2)).toBe(false);
  });

  it('builds sample values per mode', () => {
    const sample = sampleFromDeviceOrientation({
      alpha: 90,
      beta: 1,
      gamma: -2,
      absolute: true,
    });
    expect(formatForMode('compass')).toBe('orient.compass');
    expect(valueForMode('compass', sample)).toBe('270');
    expect(valueForMode('level', sample)).toBe('1,-2');
    expect(valueForMode('incline', sample)).not.toBeNull();
  });
});
