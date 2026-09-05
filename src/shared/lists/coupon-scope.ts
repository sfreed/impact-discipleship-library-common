// Which cart lines a coupon covers, and when it beats a sale.
//
// ONE implementation, shared by the Cloud Functions (checkout pricing, the
// reader purchase paths) and the web store's cart-side coupon check, because
// the two used to carry hand-copied versions of this rule - and the 2026-08
// coupon defects were each a case of one copy drifting from the other.
// Lives in lists/ (SDK-free) so functions/scripts/sync-shared.js copies it.
import { round2 } from './money';

/**
 * Sentinel tag id: a coupon carrying this tag covers EVERY event, including
 * ones created after the coupon was.
 *
 * A sentinel TAG rather than a new field on the coupon, deliberately: every
 * bundle shipped before this existed (the web store, the reader site, the
 * Android build that bundles its own coupon check) sees a non-empty tag list
 * with no matching product id and correctly refuses the code - it fails safe
 * without being redeployed. A new field would have read as "no tags", which
 * those bundles treat as "applies to everything".
 */
export const ALL_EVENTS_TAG_ID = '__all_events__';

/** The picker option the admin Coupons dialog offers. */
export const ALL_EVENTS_TAG = { id: ALL_EVENTS_TAG_ID, tag: 'All events' };

export interface CouponLineTarget {
  /** The product or event document id. */
  id: string;
  isEvent?: boolean;
}

/**
 * Whether a coupon's tags cover one cart line. No tags at all means the
 * coupon applies to everything; otherwise the line's own id must be listed,
 * or the line is an event and the all-events sentinel is.
 */
export function couponTagsCover(
  tags: { id?: string }[] | undefined | null,
  line: CouponLineTarget
): boolean {
  if (!tags?.length) {
    return true;
  }
  return tags.some(
    (tag) =>
      tag.id === line.id ||
      (tag.id === ALL_EVENTS_TAG_ID && line.isEvent === true)
  );
}

/**
 * A sale price normally beats a coupon (the two never stack). A 100% coupon
 * is a giveaway, not a discount, and the owner's rule (2026-09-03) is that a
 * giveaway must get the holder in free even while a sale or early-bird offer
 * is running - so it is the one case that overrides the sale.
 */
export function couponOverridesSale(percentOff: unknown): boolean {
  return typeof percentOff === 'number' && percentOff >= 100;
}

/**
 * Whether a coupon takes effect on a line, given whether that line is
 * already at a sale price: always when it is not on sale, and only for a
 * giveaway when it is. The one question every pricing path asks before
 * discounting a line - the reader Store and both of its server paths used
 * to skip it and stack the coupon on top of the sale (found 2026-09-05).
 */
export function couponBeatsSale(percentOff: unknown, onSale: boolean): boolean {
  return !onSale || couponOverridesSale(percentOff);
}

/**
 * The per-unit coupon discount on a line, to the cent - 0 when the sale
 * price wins. `unitPrice` is the price actually charged before the coupon
 * (the sale price when on sale), so a giveaway takes the line to $0.
 */
export function couponUnitDiscount(
  percentOff: unknown,
  unitPrice: number,
  onSale: boolean
): number {
  if (!couponBeatsSale(percentOff, onSale)) {
    return 0;
  }
  const percent = typeof percentOff === 'number' ? Math.min(100, Math.max(0, percentOff)) : 0;
  return round2((unitPrice * percent) / 100);
}
