import { parseHexColor, rgbToHex } from './color-hex';

describe('color-hex', () => {
  it('formats and parses #rrggbb', () => {
    expect(rgbToHex(196, 92, 38)).toBe('#c45c26');
    expect(parseHexColor('#c45c26')).toEqual({ hex: '#c45c26', r: 196, g: 92, b: 38 });
    expect(parseHexColor('c45c26')).toEqual({ hex: '#c45c26', r: 196, g: 92, b: 38 });
  });

  it('expands #rgb and rejects junk', () => {
    expect(parseHexColor('#0f8')).toEqual({ hex: '#00ff88', r: 0, g: 255, b: 136 });
    expect(parseHexColor('not-a-color')).toBeNull();
    expect(parseHexColor('')).toBeNull();
  });
});
