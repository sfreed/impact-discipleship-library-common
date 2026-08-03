// Pure lookup logic for BulkDiscountTier, kept framework-free and
// independent of either app's Firestore service so it's testable with no
// TestBed/mocking - same approach as the reader app's store-pricing.ts.

import { BulkDiscountTier } from './bulk-discount-tier.model';

/** The highest tier whose `numberOfBooks` is at or below `quantity` - e.g.
 *  tiers of 5→10%/10→20%, buying 7 resolves to the 5-book 10% tier, buying
 *  12 resolves to 20%. Buying fewer than the lowest configured tier (or an
 *  empty tier list) resolves to 0%. */
export function resolveBulkDiscountPercent(tiers: BulkDiscountTier[], quantity: number): number {
  const applicable = tiers.filter((tier) => tier.numberOfBooks <= quantity);
  if (!applicable.length) {
    return 0;
  }
  return applicable.reduce((best, tier) => (tier.numberOfBooks > best.numberOfBooks ? tier : best)).percentOff;
}
