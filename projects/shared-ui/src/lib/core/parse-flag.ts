/** Open-param boolean: 1 / true / yes. */
export function parseFlag(raw: string | null | undefined): boolean {
  if (raw == null || raw === '') {
    return false;
  }
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
