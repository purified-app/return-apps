import { parsePinLength, parsePinMask } from './pin-params';

describe('pin-params', () => {
  it('clamps PIN length to 3–12', () => {
    expect(parsePinLength(null)).toBe(4);
    expect(parsePinLength('6')).toBe(6);
    expect(parsePinLength('2')).toBe(4);
    expect(parsePinLength('12')).toBe(12);
    expect(parsePinLength('13')).toBe(4);
    expect(parsePinLength('4.9')).toBe(4);
  });

  it('parses mask flags', () => {
    expect(parsePinMask(null)).toBe(true);
    expect(parsePinMask('0')).toBe(false);
    expect(parsePinMask('false')).toBe(false);
    expect(parsePinMask('true')).toBe(true);
  });
});
