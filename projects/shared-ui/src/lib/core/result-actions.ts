/** Copy plain text to the clipboard. Returns false when the API fails or is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Trigger a file download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Trigger a file download from a data URL (e.g. SVG signature). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Download UTF-8 text as a file. */
export function downloadText(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}

/**
 * Rasterize an SVG data URL to a PNG blob (for signature download).
 * Rejects if the image fails to load or canvas is unavailable.
 */
export function svgDataUrlToPngBlob(
  svgDataUrl: string,
  options?: { scale?: number; background?: string },
): Promise<Blob> {
  const scale = options?.scale ?? 2;
  const background = options?.background ?? '#ffffff';

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas is unavailable.'));
        return;
      }
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not encode PNG.'));
            return;
          }
          resolve(blob);
        },
        'image/png',
        0.92,
      );
    };
    image.onerror = () => reject(new Error('Could not load SVG for PNG export.'));
    image.src = svgDataUrl;
  });
}

export type ResultDownload =
  | {
      label: string;
      filename: string;
      kind: 'dataUrl';
      dataUrl: string;
    }
  | {
      label: string;
      filename: string;
      kind: 'text';
      text: string;
      mimeType?: string;
    }
  | {
      label: string;
      filename: string;
      kind: 'blob';
      getBlob: () => Blob | Promise<Blob>;
    };
