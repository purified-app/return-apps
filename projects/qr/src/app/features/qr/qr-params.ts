export type QrOutput = 'svg' | 'png';

export function parseQrOutput(raw: string | null | undefined): QrOutput {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'png' || v === 'qr.png' || v === 'image/png') {
    return 'png';
  }
  return 'svg';
}
