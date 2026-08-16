import { renderSVG } from 'uqr';

export function qrSvg(text: string, options: { pixelSize?: number } = {}): string {
  return renderSVG(text, {
    border: 2,
    ecc: 'M',
    pixelSize: options.pixelSize ?? 8,
    whiteColor: '#ffffff',
    blackColor: '#0f1418',
  });
}

export function qrSvgDataUrl(text: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(text))}`;
}
