import { couponBeatsSale, couponUnitDiscount } from './coupon-scope';

// The sale-versus-coupon rule, as one function every pricing path asks.
// The reader Store and both of its server paths stacked a coupon on top of
// a sale price until 2026-09-05, while the web cart and the store checkout
// did not - so the same code and the same book priced differently
// depending on which app the shopper stood in.
describe('couponBeatsSale', () => {
  it('always takes effect on a line that is not on sale', () => {
    expect(couponBeatsSale(10, false)).toBeTrue();
    expect(couponBeatsSale(100, false)).toBeTrue();
  });

  it('loses to a sale price unless it is a giveaway', () => {
    expect(couponBeatsSale(10, true)).toBeFalse();
    expect(couponBeatsSale(99, true)).toBeFalse();
    expect(couponBeatsSale(100, true)).toBeTrue();
  });

  it('treats a missing or malformed percentage as no coupon', () => {
    expect(couponBeatsSale(undefined, true)).toBeFalse();
    expect(couponBeatsSale('100', true)).toBeFalse();
  });
});

describe('couponUnitDiscount', () => {
  it('discounts the unit price to the cent', () => {
    expect(couponUnitDiscount(25, 10, false)).toBe(2.5);
    expect(couponUnitDiscount(33, 9.99, false)).toBe(3.3);
  });

  it('is 0 on a sale line for anything short of a giveaway', () => {
    expect(couponUnitDiscount(50, 10, true)).toBe(0);
  });

  it('takes a sale line to $0 for a giveaway', () => {
    expect(couponUnitDiscount(100, 30, true)).toBe(30);
  });

  it('clamps an out-of-range percentage rather than over-discounting', () => {
    expect(couponUnitDiscount(250, 10, false)).toBe(10);
    expect(couponUnitDiscount(-5, 10, false)).toBe(0);
    expect(couponUnitDiscount(null, 10, false)).toBe(0);
  });
});
