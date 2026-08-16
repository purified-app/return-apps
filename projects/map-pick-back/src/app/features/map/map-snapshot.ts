import {
  formatArea,
  formatDistance,
  type LatLngPoint,
  pathLengthMeters,
  polygonAreaSquareMeters,
  polygonLabelPoint,
  type UnitSystem,
} from './map-geo';

export type SnapshotKind = 'measure' | 'area';

/**
 * Build a self-contained SVG of a path/polygon with a stats label.
 * Used for “Save image” without depending on map tile CORS.
 */
export function buildMeasurementSvg(
  kind: SnapshotKind,
  points: readonly LatLngPoint[],
  options?: { title?: string; width?: number; height?: number; units?: UnitSystem },
): string {
  const width = options?.width ?? 720;
  const height = options?.height ?? 480;
  const pad = 48;
  const units = options?.units ?? 'metric';
  const title =
    options?.title ?? (kind === 'measure' ? 'Distance measurement' : 'Area measurement');

  if (points.length === 0) {
    return emptySvg(width, height, title, 'No points yet');
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // Expand degenerate bounds so a single point / line still draws.
  if (maxLat - minLat < 1e-6) {
    minLat -= 0.01;
    maxLat += 0.01;
  }
  if (maxLng - minLng < 1e-6) {
    minLng -= 0.01;
    maxLng += 0.01;
  }

  const midLat = (minLat + maxLat) / 2;
  const cosLat = Math.max(0.2, Math.cos((midLat * Math.PI) / 180));
  const spanX = (maxLng - minLng) * cosLat;
  const spanY = maxLat - minLat;
  const drawW = width - pad * 2;
  const drawH = height - pad * 2 - 36;
  const scale = Math.min(drawW / spanX, drawH / spanY);

  const project = (p: LatLngPoint): { x: number; y: number } => {
    const x = pad + ((p.lng - minLng) * cosLat - spanX / 2) * scale + drawW / 2;
    const y = pad + 28 + (spanY / 2 - (p.lat - minLat)) * scale + drawH / 2;
    return { x, y };
  };

  const projected = points.map(project);
  const pathD = projected
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const closed =
    kind === 'area' && projected.length >= 3
      ? `${pathD} L${projected[0]!.x.toFixed(1)} ${projected[0]!.y.toFixed(1)} Z`
      : pathD;

  const areaText = formatArea(polygonAreaSquareMeters(points), units);
  const stats =
    kind === 'measure'
      ? `Length ${formatDistance(pathLengthMeters(points), units)} · ${points.length} points`
      : `Area ${areaText} · ${points.length} vertices`;

  const markers = projected
    .map(
      (p, i) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="#e8edf2" stroke="#10151a" stroke-width="2"/>` +
        `<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle" font-size="12" fill="#eef2f5" font-family="Segoe UI, Helvetica, Arial, sans-serif">${i + 1}</text>`,
    )
    .join('');

  const fill =
    kind === 'area' && projected.length >= 3
      ? `<path d="${closed}" fill="rgba(74,163,199,0.28)" stroke="#4aa3c7" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="${closed}" fill="none" stroke="#4aa3c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

  let centerLabel = '';
  if (kind === 'area' && points.length >= 3) {
    const center = polygonLabelPoint(points);
    if (center) {
      const c = project(center);
      centerLabel = `<rect x="${(c.x - 48).toFixed(1)}" y="${(c.y - 14).toFixed(1)}" width="96" height="28" rx="8" fill="rgba(16,21,26,0.88)" stroke="rgba(255,255,255,0.14)"/>
  <text x="${c.x.toFixed(1)}" y="${(c.y + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#eef2f5" font-family="Segoe UI, Helvetica, Arial, sans-serif">${escapeXml(areaText)}</text>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>${escapeXml(title)}</title>
  <rect width="100%" height="100%" fill="#10151a"/>
  <text x="${pad}" y="28" fill="#eef2f5" font-size="18" font-weight="700" font-family="Segoe UI, Helvetica, Arial, sans-serif">${escapeXml(title)}</text>
  <text x="${pad}" y="${height - 18}" fill="#b7c2cc" font-size="14" font-family="Segoe UI, Helvetica, Arial, sans-serif">${escapeXml(stats)}</text>
  ${fill}
  ${markers}
  ${centerLabel}
</svg>`;
}

function emptySvg(width: number, height: number, title: string, message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#10151a"/>
  <text x="24" y="36" fill="#eef2f5" font-size="18" font-weight="700" font-family="Segoe UI, Helvetica, Arial, sans-serif">${escapeXml(title)}</text>
  <text x="24" y="64" fill="#b7c2cc" font-size="14" font-family="Segoe UI, Helvetica, Arial, sans-serif">${escapeXml(message)}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Trigger a browser download of an SVG string as `.svg`. */
export function downloadSvg(filename: string, svg: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
