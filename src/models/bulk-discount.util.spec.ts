import { BulkDiscountTier } from './bulk-discount-tier.model';
import { resolveBulkDiscountPercent } from './bulk-discount.util';

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
