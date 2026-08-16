import { svgDataUrlToPngBlob } from 'shared-ui';
import { qrSvg, svgWithExplicitSize } from './qr-svg';

export function qrPngBlob(text: string): Promise<Blob> {
  const svg = svgWithExplicitSize(qrSvg(text, { pixelSize: 16 }));
  return svgDataUrlToPngBlob(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, {
    scale: 2,
    background: '#ffffff',
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read blob.'));
    reader.readAsDataURL(blob);
  });
}
