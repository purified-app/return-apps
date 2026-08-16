import type * as L from 'leaflet';
import {
  formatArea,
  formatDistance,
  type LatLngPoint,
  pathLengthMeters,
  polygonAreaSquareMeters,
  polygonLabelPoint,
  segmentLengthsMeters,
  type UnitSystem,
} from './map-geo';

export type SnapshotKind = 'measure' | 'area';

export type CaptureMapOptions = {
  units?: UnitSystem;
  title?: string;
  /** Extra wait for tiles after an invalidate (ms). */
  settleMs?: number;
};

/**
 * Capture the current Leaflet map view as a PNG, including basemap tiles
 * and measurement overlays. Requires the tile layer to use `crossOrigin`
 * with a CORS-enabled tile host.
 */
export async function captureMapPng(
  map: L.Map,
  kind: SnapshotKind,
  points: readonly LatLngPoint[],
  options?: CaptureMapOptions,
): Promise<Blob> {
  const units = options?.units ?? 'metric';
  const title =
    options?.title ?? (kind === 'measure' ? 'Distance measurement' : 'Area measurement');
  const settleMs = options?.settleMs ?? 250;

  map.invalidateSize();
  await delay(settleMs > 0 ? settleMs : 300);

  const size = map.getSize();
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(size.x * dpr));
  canvas.height = Math.max(1, Math.round(size.y * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#1a2228';
  ctx.fillRect(0, 0, size.x, size.y);

  await drawBasemapTiles(map, ctx);
  drawOverlays(map, ctx, kind, points, units);
  drawFooter(ctx, size.x, size.y, kind, points, units, title);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png');
  });
  if (!blob) {
    throw new Error('PNG encode failed');
  }
  return blob;
}


export function parseCssTranslate(el: HTMLElement): { x: number; y: number } {
  const inline = el.style.transform;
  const fromInline = parseTransformValue(inline);
  if (fromInline) {
    return fromInline;
  }
  const computed = getComputedStyle(el).transform;
  return parseTransformValue(computed) ?? { x: 0, y: 0 };
}

function parseTransformValue(value: string | null | undefined): { x: number; y: number } | null {
  if (!value || value === 'none') {
    return null;
  }
  const m3 = value.match(/translate3d\(\s*([^,]+)\s*,\s*([^,]+)\s*,/);
  if (m3) {
    return { x: parseFloat(m3[1]!) || 0, y: parseFloat(m3[2]!) || 0 };
  }
  const m2 = value.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\)/);
  if (m2) {
    return { x: parseFloat(m2[1]!) || 0, y: parseFloat(m2[2]!) || 0 };
  }
  const matrix = value.match(/matrix\(([^)]+)\)/);
  if (matrix) {
    const parts = matrix[1]!.split(',').map((p) => parseFloat(p.trim()));
    return { x: parts[4] || 0, y: parts[5] || 0 };
  }
  return null;
}

async function drawBasemapTiles(map: L.Map, ctx: CanvasRenderingContext2D): Promise<void> {
  const mapPane = map.getPane('mapPane') as HTMLElement | undefined;
  if (!mapPane) {
    return;
  }
  const mapPanePos = parseCssTranslate(mapPane);
  const imgs = Array.from(
    map.getContainer().querySelectorAll('.leaflet-tile-pane img.leaflet-tile'),
  ) as HTMLImageElement[];

  await Promise.all(
    imgs.map(async (img) => {
      try {
        if (img.decode) {
          await img.decode();
        }
      } catch {
        // Ignore decode failures; drawImage may still work if complete.
      }
    }),
  );

  for (const img of imgs) {
    if (!img.complete || img.naturalWidth === 0) {
      continue;
    }
    const layer = img.closest('.leaflet-layer') as HTMLElement | null;
    const layerPos = layer ? parseCssTranslate(layer) : { x: 0, y: 0 };
    const tilePos = parseCssTranslate(img);
    const left = parseFloat(img.style.left) || 0;
    const top = parseFloat(img.style.top) || 0;
    const x = mapPanePos.x + layerPos.x + tilePos.x + left;
    const y = mapPanePos.y + layerPos.y + tilePos.y + top;
    const w = img.offsetWidth || img.naturalWidth || 256;
    const h = img.offsetHeight || img.naturalHeight || 256;
    try {
      ctx.drawImage(img, x, y, w, h);
    } catch {
      // Skip tainted tiles rather than failing the whole export.
    }
  }
}

function drawOverlays(
  map: L.Map,
  ctx: CanvasRenderingContext2D,
  kind: SnapshotKind,
  points: readonly LatLngPoint[],
  units: UnitSystem,
): void {
  if (points.length === 0) {
    return;
  }

  const screen = points.map((p) => map.latLngToContainerPoint([p.lat, p.lng]));

  if (kind === 'area' && screen.length >= 3) {
    ctx.beginPath();
    screen.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = 'rgba(74, 163, 199, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#4aa3c7';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const center = polygonLabelPoint(points);
    if (center) {
      const c = map.latLngToContainerPoint([center.lat, center.lng]);
      drawPill(ctx, c.x, c.y, formatArea(polygonAreaSquareMeters(points), units), 0.9);
    }
  } else if (screen.length >= 2) {
    ctx.beginPath();
    screen.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = '#4aa3c7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (kind === 'measure') {
      const lengths = segmentLengthsMeters(points);
      for (let i = 0; i < lengths.length; i++) {
        const a = screen[i]!;
        const b = screen[i + 1]!;
        drawPill(
          ctx,
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
          formatDistance(lengths[i]!, units),
          0.75,
        );
      }
    }
  }

  screen.forEach((p, index) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e8edf2';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#10151a';
    ctx.stroke();
    drawPill(ctx, p.x, p.y - 18, String(index + 1), 0.7);
  });
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: SnapshotKind,
  points: readonly LatLngPoint[],
  units: UnitSystem,
  title: string,
): void {
  const stats =
    kind === 'measure'
      ? `Length ${formatDistance(pathLengthMeters(points), units)} · ${points.length} points`
      : `Area ${formatArea(polygonAreaSquareMeters(points), units)} · ${points.length} vertices`;

  ctx.fillStyle = 'rgba(16, 21, 26, 0.82)';
  ctx.fillRect(0, 0, width, 40);
  ctx.fillRect(0, height - 36, width, 36);

  ctx.fillStyle = '#eef2f5';
  ctx.font = '700 15px "Segoe UI", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 12, 20);

  ctx.fillStyle = '#b7c2cc';
  ctx.font = '600 13px "Segoe UI", Helvetica, Arial, sans-serif';
  ctx.fillText(stats, 12, height - 18);

  ctx.fillStyle = '#8f9aa6';
  ctx.font = '11px "Segoe UI", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('© OpenStreetMap · © CARTO', width - 12, height - 18);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  fontSizeRem: number,
): void {
  const fontPx = Math.round(fontSizeRem * 16);
  ctx.font = `700 ${fontPx}px "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 16;
  const h = fontPx + 10;
  ctx.fillStyle = 'rgba(16, 21, 26, 0.88)';
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = '#eef2f5';
  ctx.fillText(text, x, y);
}


function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
