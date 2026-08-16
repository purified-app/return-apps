/** Orientation helpers for compass / spirit level / incline. */

export type OrientMode = 'compass' | 'level' | 'incline';

export type OrientationSample = {
  /** Compass heading 0–360 (deg), null when unavailable. */
  heading: number | null;
  /** Front–back tilt (DeviceOrientation beta). */
  pitch: number | null;
  /** Left–right tilt (DeviceOrientation gamma). */
  roll: number | null;
  /** Absolute angle from horizontal (deg), 0 = flat. */
  incline: number | null;
  absolute: boolean;
};

export const ORIENT_MODES: readonly OrientMode[] = ['compass', 'level', 'incline'];

export function parseOrientMode(raw: string | null | undefined): OrientMode | null {
  if (!raw) {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  return ORIENT_MODES.includes(normalized as OrientMode) ? (normalized as OrientMode) : null;
}

export function parseThreshold(raw: string | null | undefined, fallback = 2): number {
  if (raw == null || raw === '') {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }
  return Math.min(45, n);
}

/** Normalize degrees into [0, 360). */
export function normalizeHeading(degrees: number): number {
  const mod = degrees % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function roundOrient(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Derive a compass heading from DeviceOrientation fields.
 * Prefers `webkitCompassHeading` (iOS), then absolute alpha.
 */
export function compassHeadingFromEvent(event: {
  alpha: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
}): number | null {
  const webkit = event.webkitCompassHeading;
  if (typeof webkit === 'number' && Number.isFinite(webkit)) {
    return normalizeHeading(webkit);
  }
  if (event.alpha == null || !Number.isFinite(event.alpha)) {
    return null;
  }
  // Most browsers: alpha is degrees from north with opposite sense to compass heading.
  return normalizeHeading(360 - event.alpha);
}

/**
 * Inclination from horizontal using beta/gamma (degrees).
 * 0 ≈ device lying flat face-up; ~90 ≈ upright.
 */
export function inclineFromPitchRoll(pitch: number, roll: number): number {
  const beta = (pitch * Math.PI) / 180;
  const gamma = (roll * Math.PI) / 180;
  const sinSq =
    Math.sin(beta) ** 2 + Math.sin(gamma) ** 2 * Math.cos(beta) ** 2;
  const clamped = Math.min(1, Math.max(0, sinSq));
  return (Math.asin(Math.sqrt(clamped)) * 180) / Math.PI;
}

export function isWithinLevelThreshold(
  pitch: number,
  roll: number,
  threshold: number,
): boolean {
  return Math.abs(pitch) <= threshold && Math.abs(roll) <= threshold;
}

export function sampleFromDeviceOrientation(event: {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
}): OrientationSample {
  const pitch = event.beta != null && Number.isFinite(event.beta) ? event.beta : null;
  const roll = event.gamma != null && Number.isFinite(event.gamma) ? event.gamma : null;
  const incline =
    pitch != null && roll != null ? inclineFromPitchRoll(pitch, roll) : null;
  return {
    heading: compassHeadingFromEvent(event),
    pitch,
    roll,
    incline,
    absolute: Boolean(event.absolute) || typeof event.webkitCompassHeading === 'number',
  };
}

export function formatForMode(mode: OrientMode): string {
  switch (mode) {
    case 'compass':
      return 'orient.compass';
    case 'level':
      return 'orient.level';
    case 'incline':
      return 'orient.incline';
  }
}

export function valueForMode(mode: OrientMode, sample: OrientationSample): string | null {
  switch (mode) {
    case 'compass':
      return sample.heading == null ? null : String(roundOrient(sample.heading));
    case 'level':
      if (sample.pitch == null || sample.roll == null) {
        return null;
      }
      return `${roundOrient(sample.pitch)},${roundOrient(sample.roll)}`;
    case 'incline':
      return sample.incline == null ? null : String(roundOrient(sample.incline));
  }
}

export function cardinalLabel(heading: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  const idx = Math.round(normalizeHeading(heading) / 45) % 8;
  return dirs[idx] ?? 'N';
}
