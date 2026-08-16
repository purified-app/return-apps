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

/** uqr SVGs are viewBox-only; canvas rasterization needs width/height. */
export function svgWithExplicitSize(svg: string): string {
  if (/^<svg\b[^>]*\swidth="/.test(svg)) {
    return svg;
  }
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!match) {
    return svg;
  }
  return svg.replace('<svg ', `<svg width="${match[1]}" height="${match[2]}" `);
}
