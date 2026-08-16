/** Barcode Detector API format names (also used by the WASM ponyfill). */
export type DetectorFormat =
  | 'qr_code'
  | 'ean_13'
  | 'ean_8'
  | 'code_128'
  | 'code_39'
  | 'upc_a'
  | 'upc_e'
  | 'itf'
  | 'data_matrix';

export const DEFAULT_SCAN_FORMATS: DetectorFormat[] = [
  'qr_code',
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'upc_a',
  'upc_e',
  'itf',
  'data_matrix',
];

/** Accept legacy ZXing-style names and Detector API names from `?formats=`. */
const FORMAT_ALIASES: Record<string, DetectorFormat> = {
  QR_CODE: 'qr_code',
  QR: 'qr_code',
  qr: 'qr_code',
  qr_code: 'qr_code',
  EAN_13: 'ean_13',
  ean_13: 'ean_13',
  EAN_8: 'ean_8',
  ean_8: 'ean_8',
  CODE_128: 'code_128',
  code_128: 'code_128',
  CODE_39: 'code_39',
  code_39: 'code_39',
  UPC_A: 'upc_a',
  upc_a: 'upc_a',
  UPC_E: 'upc_e',
  upc_e: 'upc_e',
  ITF: 'itf',
  itf: 'itf',
  DATA_MATRIX: 'data_matrix',
  data_matrix: 'data_matrix',
};

export function parseScanFormats(formatsParam: string | null | undefined): DetectorFormat[] {
  if (!formatsParam?.trim()) {
    return DEFAULT_SCAN_FORMATS;
  }

  const parsed = formatsParam
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((name) => FORMAT_ALIASES[name] ?? FORMAT_ALIASES[name.toUpperCase()] ?? FORMAT_ALIASES[name.toLowerCase()])
    .filter((f): f is DetectorFormat => f !== undefined);

  return parsed.length > 0 ? [...new Set(parsed)] : DEFAULT_SCAN_FORMATS;
}

export function scanFormatTag(rawFormat: string): string {
  const normalized = rawFormat.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `scan.${normalized || 'unknown'}`;
}
