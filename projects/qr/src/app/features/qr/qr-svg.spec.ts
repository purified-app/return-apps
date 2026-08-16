import { qrSvg, qrSvgDataUrl, svgWithExplicitSize } from './qr-svg';

describe('qr-svg', () => {
  it('renders an SVG matrix for text', () => {
    const svg = qrSvg('hello');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(qrSvgDataUrl('hello')).toMatch(/^data:image\/svg\+xml/);
  });

  it('adds width and height from viewBox for PNG rasterization', () => {
    const sized = svgWithExplicitSize(qrSvg('hello'));
    expect(sized).toMatch(/<svg width="[\d.]+" height="[\d.]+" /);
    expect(svgWithExplicitSize(sized)).toBe(sized);
  });
});
