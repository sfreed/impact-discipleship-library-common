// Money, to the cent - ONE rounding for every price the suite computes.
//
// Until 2026-09-05 five copies existed (the reader's store-pricing, three
// in the Cloud Functions, one in campaign-offer.model) and they did not all
// agree: checkout-pricing rounded with `Number(value.toFixed(2))`, the rest
// with `Math.round(value * 100) / 100`. The two differ on some inputs, and
// the server total is what a PayPal capture is verified against to the
// cent, so a cart and its checkout could legitimately disagree by a penny.
//
// Lives in lists/ (SDK-free) so functions/scripts/sync-shared.js copies it,
// the same reason coupon-scope.ts is here.

/**
 * Rounds to two decimal places. Math.round on the scaled value, not
 * toFixed: it is the form the reader and the reader's server paths always
 * used, so it is the one that changes nothing for a live purchase.
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
