import { round2 } from './money';

describe('round2', () => {
  it('rounds to the cent', () => {
    expect(round2(19.999)).toBe(20);
    expect(round2(3.14159)).toBe(3.14);
    expect(round2(0)).toBe(0);
    expect(round2(5)).toBe(5);
  });

  it('clears the float tail a raw percentage leaves behind', () => {
    // 15% off $22.99 raw is 19.541499999999996 - the v2 sale bug.
    expect(round2(22.99 - (15 / 100) * 22.99)).toBe(19.54);
  });

  it('is the Math.round form, not toFixed', () => {
    // The two disagree on ties that binary floats land just below: 0.015
    // rounds to 0.02 here and to "0.01" through toFixed(2). The reader and
    // its server paths have always used this form, so it is the suite's.
    expect(round2(0.015)).toBe(0.02);
    expect(Number((0.015).toFixed(2))).toBe(0.01);
  });
});
