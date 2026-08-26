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

/** Which discount a group-license purchase actually got, and what it beat. */
export type LicenseDiscountSource = 'bulk' | 'coupon' | 'none';

export interface LicenseDiscountChoice {
  /** The percent actually applied - what the price is computed from. */
  percentOff: number;
  source: LicenseDiscountSource;
  /** Both inputs, kept so the UI can explain the choice without redoing it. */
  bulkPercentOff: number;
  couponPercentOff: number;
  /** A usable coupon was offered and the bulk tier matched or beat it, so
   *  the coupon was NOT applied. This is the case the leader is told about;
   *  it stays false when no coupon was offered at all. */
  bulkBeatsCoupon: boolean;
}

/** Picks the better of a quantity-based bulk tier and a coupon - the two are
 *  EXCLUSIVE, never stacked, and a tie goes to bulk.
 *
 *  Both are plain percentages off the same subtotal (a group-license
 *  purchase is one product times a quantity), so "better" is just the larger
 *  percent - no need to price both and compare totals.
 *
 *  `couponPercentOff` must be null when there is no coupon OR when the
 *  coupon does not cover this product: a tagged coupon only applies to the
 *  products it names, and passing 0 instead of null would wrongly report
 *  bulkBeatsCoupon and tell the leader their bulk deal beat a coupon that
 *  was never in the running.
 *
 *  Negative/NaN inputs floor to 0 and anything above 100 clamps to 100, so a
 *  malformed tier row or coupon doc can never produce a negative price or
 *  pay the buyer.
 */
export function chooseLicenseDiscount(
  bulkPercentOff: number,
  couponPercentOff: number | null | undefined,
): LicenseDiscountChoice {
  const clamp = (value: number | null | undefined): number =>
    Math.min(100, Math.max(0, Number.isFinite(value as number) ? (value as number) : 0));

  const bulk = clamp(bulkPercentOff);
  const hasCoupon = couponPercentOff !== null && couponPercentOff !== undefined;
  const coupon = hasCoupon ? clamp(couponPercentOff) : 0;

  if (hasCoupon && coupon > bulk) {
    return {
      percentOff: coupon,
      source: 'coupon',
      bulkPercentOff: bulk,
      couponPercentOff: coupon,
      bulkBeatsCoupon: false,
    };
  }
  return {
    percentOff: bulk,
    source: bulk > 0 ? 'bulk' : 'none',
    bulkPercentOff: bulk,
    couponPercentOff: coupon,
    // Only meaningful when a coupon was actually in the running.
    bulkBeatsCoupon: hasCoupon,
  };
}
