/** Device orientation permission + screen wake lock helpers. */

export type OrientationPermissionResult = 'granted' | 'denied' | 'unavailable';

type DeviceOrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | string>;
};

type WakeLockSentinelLike = { release: () => Promise<void> };

export function isDeviceOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

/** True when the browser requires a user gesture before orientation events (iOS). */
export function needsOrientationGesture(): boolean {
  if (!isDeviceOrientationSupported()) {
    return false;
  }
  const DOE = DeviceOrientationEvent as DeviceOrientationConstructor;
  return typeof DOE.requestPermission === 'function';
}

export async function requestOrientationPermission(): Promise<OrientationPermissionResult> {
  if (!isDeviceOrientationSupported()) {
    return 'unavailable';
  }
  const DOE = DeviceOrientationEvent as DeviceOrientationConstructor;
  if (typeof DOE.requestPermission !== 'function') {
    return 'granted';
  }
  try {
    const result = await DOE.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Best-effort screen wake lock while sensors are active. */
export class ScreenWakeLock {
  private wakeLock: WakeLockSentinelLike | null = null;

  async request(): Promise<void> {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock?.request) {
      return;
    }
    try {
      this.wakeLock = await nav.wakeLock.request('screen');
    } catch {
      /* ignore — not critical for the tool */
    }
  }

  async release(): Promise<void> {
    if (!this.wakeLock) {
      return;
    }
    try {
      await this.wakeLock.release();
    } catch {
      /* ignore */
    }
    this.wakeLock = null;
  }
}
