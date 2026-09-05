// The reader app's READ projections of two admin-owned documents, and the
// server's view of a coupon document. Declared here - beside the document
// types they project, SDK-free so the Cloud Functions get a copy - rather
// than inside the reader, so that a field renamed on ProductModel or
// CouponModel fails to compile HERE (see shared/models/model-projections.
// spec.ts) instead of silently reading undefined in the reader.
//
// Until 2026-09-05 these lived in the reader's core/models/store.model.ts
// and the functions' utils/coupons.ts as hand-kept subsets, with a comment
// asking that "field names must stay in sync". Nothing checked that they
// did.

/** An image reference as ProductModel stores it ({url, name}). */
export interface StoreProductImage {
  url: string;
  name?: string;
}

/** Only the fields the reader's Store feature reads off a `products`
 *  document (the admin's ProductModel is the full record). */
export interface StoreProduct {
  id: string;
  title: string;
  description?: string;
  cost: number;
  salePrice?: number;
  imageUrl?: StoreProductImage;
  isActive?: boolean;
  isDigitalBook: boolean;
  /** The id of the corresponding doc in the library's `books` - NOT the
   *  same as this product's own `id`. This is what gets written into
   *  LibraryUser.licensedBookIds/bookLicenses on purchase. */
  digitalBookId: string;
  languages?: string[];
  /** Position within the product's series (e.g. "Impact One" = 1, "Impact
   *  Two" = 2) - the same field the web store sorts by when filtering by
   *  series. Titles spell out the number as a word ("One"/"Two"/...), so
   *  alphabetical order doesn't match reading order. */
  seriesOrder?: number;
  /** Marks a free PDF resource - a different thing from isDigitalBook
   *  (in-app licensed reading); a few products carry both flags, which is
   *  why the reader's free-ebook list also requires cost === 0 + eBookUrl. */
  isEBook?: boolean;
  /** The uploaded PDF itself - a public Firebase Storage download URL, same
   *  {url, name} shape as imageUrl. */
  eBookUrl?: StoreProductImage;
  /** The web store's own "list this in the store" toggle. Absent on some
   *  older products - treat absent as shown (`!== false`), matching how
   *  isActive is read. */
  showInStore?: boolean;
}

/** A coupon document as the Cloud Functions read it - every field the
 *  money paths touch, with `expiresAt` left as `unknown` because the stored
 *  shape varies (Timestamp, a plain {seconds, nanoseconds} map, an ISO
 *  string) and utils/date-normalize's toMillis is the one thing that reads
 *  it. The admin's CouponModel is the full record. */
export interface CouponDocument {
  code?: string;
  isActive?: boolean;
  percentOff?: number | null;
  expiresAt?: unknown;
  tags?: { id: string }[];
}
