import {
  cardinalLabel,
  compassHeadingFromEvent,
  formatForMode,
  inclineFromPitchRoll,
  isWithinLevelThreshold,
  levelDeviation,
  modeTitle,
  normalizeHeading,
  parseFlag,
  parseOrientMode,
  parseThreshold,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
  withInclineTare,
} from './orient-math';

describe('orient-math', () => {
  it('parses modes, thresholds, and flags', () => {
    expect(parseOrientMode('level')).toBe('level');
    expect(parseOrientMode('nope')).toBeNull();
    expect(parseThreshold('3.5')).toBe(3.5);
    expect(parseThreshold('-1')).toBe(2);
    expect(parseThreshold(null)).toBe(2);
    expect(parseFlag('true')).toBe(true);
    expect(parseFlag('0')).toBe(false);
    expect(modeTitle('incline')).toBe('Incline');
  });

  it('normalizes headings and labels cardinals', () => {
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-10)).toBe(350);
    expect(cardinalLabel(0)).toBe('N');
    expect(cardinalLabel(90)).toBe('E');
    expect(cardinalLabel(180)).toBe('S');
  });

  it('prefers webkit compass heading', () => {
    expect(compassHeadingFromEvent({ alpha: 10, webkitCompassHeading: 42 })).toBe(42);
    expect(compassHeadingFromEvent({ alpha: 90 })).toBe(270);
  });

  it('computes incline, level threshold, deviation, and tare', () => {
    expect(roundOrient(inclineFromPitchRoll(0, 0))).toBe(0);
    expect(inclineFromPitchRoll(90, 0)).toBeGreaterThan(80);
    expect(isWithinLevelThreshold(0.5, -0.5, 2)).toBe(true);
    expect(isWithinLevelThreshold(3, 0, 2)).toBe(false);
    expect(levelDeviation(-1.5, 0.5)).toBe(1.5);
    expect(withInclineTare({ heading: null, pitch: 10, roll: 0, incline: 20 }, 5).incline).toBe(15);
  });

  it('builds sample values per mode', () => {
    const sample = sampleFromDeviceOrientation({
      alpha: 90,
      beta: 1,
      gamma: -2,
    });
    expect(formatForMode('compass')).toBe('orient.compass');
    expect(valueForMode('compass', sample)).toBe('270');
    expect(valueForMode('level', sample)).toBe('1,-2');
    expect(valueForMode('incline', sample)).not.toBeNull();
  });
});
