import { qrSvg, qrSvgDataUrl } from './qr-svg';

describe('qr-svg', () => {
  it('renders an SVG matrix for text', () => {
    const svg = qrSvg('hello');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(qrSvgDataUrl('hello')).toMatch(/^data:image\/svg\+xml/);
  });
});
