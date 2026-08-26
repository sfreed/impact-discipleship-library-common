import { BulkDiscountTier } from './bulk-discount-tier.model';
import { chooseLicenseDiscount, resolveBulkDiscountPercent } from './bulk-discount.util';

function makeTier(overrides: Partial<BulkDiscountTier> = {}): BulkDiscountTier {
  return {
    numberOfBooks: 5,
    percentOff: 10,
    updatedAt: 0,
    updatedBy: 'admin@example.com',
    ...overrides,
  };
}

describe('resolveBulkDiscountPercent', () => {
  it('returns 0 when there are no tiers at all', () => {
    expect(resolveBulkDiscountPercent([], 20)).toBe(0);
  });

  it('returns 0 when the quantity is below the lowest tier', () => {
    const tiers = [makeTier({ numberOfBooks: 5, percentOff: 10 })];
    expect(resolveBulkDiscountPercent(tiers, 4)).toBe(0);
  });

  it('matches a tier exactly at its boundary', () => {
    const tiers = [makeTier({ numberOfBooks: 5, percentOff: 10 })];
    expect(resolveBulkDiscountPercent(tiers, 5)).toBe(10);
  });

  it('resolves to the highest tier at or below the quantity', () => {
    const tiers = [
      makeTier({ numberOfBooks: 5, percentOff: 10 }),
      makeTier({ numberOfBooks: 10, percentOff: 20 }),
    ];
    expect(resolveBulkDiscountPercent(tiers, 7)).toBe(10);
    expect(resolveBulkDiscountPercent(tiers, 12)).toBe(20);
    expect(resolveBulkDiscountPercent(tiers, 10)).toBe(20);
  });

  it('is unaffected by tier array order', () => {
    const tiers = [
      makeTier({ numberOfBooks: 10, percentOff: 20 }),
      makeTier({ numberOfBooks: 5, percentOff: 10 }),
    ];
    expect(resolveBulkDiscountPercent(tiers, 8)).toBe(10);
  });
});

describe('chooseLicenseDiscount', () => {
  it('applies the coupon when it beats the bulk tier', () => {
    const choice = chooseLicenseDiscount(10, 25);
    expect(choice.source).toBe('coupon');
    expect(choice.percentOff).toBe(25);
    expect(choice.bulkBeatsCoupon).toBe(false);
  });

  it('keeps the bulk tier when it beats the coupon, and flags it', () => {
    const choice = chooseLicenseDiscount(30, 10);
    expect(choice.source).toBe('bulk');
    expect(choice.percentOff).toBe(30);
    // What the leader gets told: their code was valid but not worth using.
    expect(choice.bulkBeatsCoupon).toBe(true);
  });

  it('gives a tie to the bulk tier', () => {
    const choice = chooseLicenseDiscount(20, 20);
    expect(choice.source).toBe('bulk');
    expect(choice.percentOff).toBe(20);
    expect(choice.bulkBeatsCoupon).toBe(true);
  });

  it('never stacks the two', () => {
    // 20 + 15 would be 35; the whole point is that it is not.
    expect(chooseLicenseDiscount(20, 15).percentOff).toBe(20);
    expect(chooseLicenseDiscount(15, 20).percentOff).toBe(20);
  });

  it('does not claim bulk beat a coupon when none was offered', () => {
    const choice = chooseLicenseDiscount(20, null);
    expect(choice.source).toBe('bulk');
    // null means "no coupon in the running" - saying bulk beat it would be
    // a message about a coupon the leader never entered.
    expect(choice.bulkBeatsCoupon).toBe(false);
  });

  it('treats an inapplicable coupon (null) differently from a 0% one', () => {
    expect(chooseLicenseDiscount(0, null).source).toBe('none');
    expect(chooseLicenseDiscount(0, null).bulkBeatsCoupon).toBe(false);
    // A real coupon worth 0% off IS in the running, and bulk (also 0) wins.
    expect(chooseLicenseDiscount(0, 0).bulkBeatsCoupon).toBe(true);
  });

  it('reports no discount when neither applies', () => {
    const choice = chooseLicenseDiscount(0, null);
    expect(choice.percentOff).toBe(0);
    expect(choice.source).toBe('none');
  });

  it('clamps malformed percentages instead of producing a negative price', () => {
    expect(chooseLicenseDiscount(-10, null).percentOff).toBe(0);
    expect(chooseLicenseDiscount(0, 150).percentOff).toBe(100);
    expect(chooseLicenseDiscount(Number.NaN, null).percentOff).toBe(0);
    expect(chooseLicenseDiscount(0, Number.NaN).percentOff).toBe(0);
  });

  it('still exposes both inputs so the UI can explain the choice', () => {
    const choice = chooseLicenseDiscount(30, 10);
    expect(choice.bulkPercentOff).toBe(30);
    expect(choice.couponPercentOff).toBe(10);
  });
});
