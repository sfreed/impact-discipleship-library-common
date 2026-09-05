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
    // toFixed(2) gives "1.00" here (binary 1.005 is just under); the
    // reader and its server paths have always said 1.01 - so that is the
    // suite's answer.
    expect(round2(1.005)).toBe(1.01);
  });
});
