export function parsePinLength(raw: string | null | undefined, fallback = 4): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 3 || n > 12) {
    return fallback;
  }
  return Math.floor(n);
}

export function parsePinMask(raw: string | null | undefined, fallback = true): boolean {
  if (raw == null || raw === '') {
    return fallback;
  }
  const v = raw.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no') {
    return false;
  }
  if (v === '1' || v === 'true' || v === 'yes') {
    return true;
  }
  return fallback;
}
