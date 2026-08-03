// Staff-configured bulk-purchase discount tiers, managed from the manager
// app's Config screen and read (never written) by the reader app when a
// group leader is pricing a license purchase - see
// resolveBulkDiscountPercent in bulk-discount.util.ts. Lives in the app's own
// `bulkDiscountTiers` collection - unrelated to the legacy impactdisciples-a82a8
// project's coupon system (StoreCoupon), which is a flat percent-off, not a
// quantity tier.

/** One row of the bulk-discount table. Firestore doc id is
 *  `String(numberOfBooks)` - this is what makes "numberOfBooks must be
 *  unique" free: a duplicate is a same-id overwrite, not a silent second
 *  row, so there's no separate uniqueness check to enforce elsewhere. */
export interface BulkDiscountTier {
  numberOfBooks: number;
  percentOff: number;
  updatedAt: number;
  updatedBy: string;
}
