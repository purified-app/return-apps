export type SampledColor = {
  hex: string;
  r: number;
  g: number;
  b: number;
};

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Accept #rgb or #rrggbb (optional leading #). */
export function parseHexColor(raw: string | null | undefined): SampledColor | null {
  if (!raw?.trim()) {
    return null;
  }
  let hex = raw.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    return null;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return { hex: `#${hex}`, r, g, b };
}
