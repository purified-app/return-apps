import { afterEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocode } from './geo-reverse';

describe('reverseGeocode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns display_name from Nominatim', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ display_name: 'Oslo, Norway' }),
      }),
    );
    await expect(reverseGeocode(59.91, 10.75)).resolves.toBe('Oslo, Norway');
  });

  it('returns null on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(reverseGeocode(0, 0)).resolves.toBeNull();
  });
});
