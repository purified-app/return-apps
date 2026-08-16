import { describe, expect, it } from 'vitest';
import { parseCssTranslate } from './map-snapshot';

describe('map-snapshot', () => {
  it('parses CSS translate values used by Leaflet tiles', () => {
    const el = document.createElement('div');
    el.style.transform = 'translate3d(10px, 20px, 0px)';
    expect(parseCssTranslate(el)).toEqual({ x: 10, y: 20 });

    el.style.transform = 'translate(5px, 7px)';
    expect(parseCssTranslate(el)).toEqual({ x: 5, y: 7 });

    el.style.transform = 'matrix(1, 0, 0, 1, 12, 34)';
    expect(parseCssTranslate(el)).toEqual({ x: 12, y: 34 });
  });
});
