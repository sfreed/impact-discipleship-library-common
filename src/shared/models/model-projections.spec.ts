import { CouponModel } from './utils/coupon.model';
import { ProductModel } from './utils/product.model';
import { CouponPublicFields } from '../contract/library-callables.types';
import { CouponDocument, StoreProduct } from '../contract/library-store.types';

/**
 * Compile-time proof that every READ PROJECTION of a document names only
 * fields the document type actually has. This is what makes "one type per
 * doc" hold: the reader's StoreProduct, the lookupCoupon result and the
 * functions' CouponDocument are declared in the SDK-free contract (the
 * reader and the functions cannot compile the full models, which import the
 * client Firestore SDK), so they cannot simply `Pick` from the model - but
 * they can be checked against it here, where both sides compile.
 *
 * Rename a field on ProductModel or CouponModel without renaming it in the
 * projection and this file stops compiling, which fails the admin suite.
 * The runtime assertions below only exist so the file is a real spec.
 */
type Missing<Projection, Doc> = Exclude<keyof Projection, keyof Doc>;
type MustBeNever<T extends never> = T;

// `id` comes from BaseModel, which every document model extends.
type _productProjection = MustBeNever<Missing<StoreProduct, ProductModel>>;
type _couponPublic = MustBeNever<Missing<CouponPublicFields, CouponModel>>;
type _couponDocument = MustBeNever<Missing<CouponDocument, CouponModel>>;

describe('document read projections', () => {
  it("StoreProduct names only ProductModel's fields", () => {
    const witness: _productProjection = undefined as never;
    expect(witness).toBeUndefined();
    expect(new ProductModel()).toBeTruthy();
  });

  it("the coupon projections name only CouponModel's fields", () => {
    const witness: _couponPublic | _couponDocument = undefined as never;
    expect(witness).toBeUndefined();
    expect(new CouponModel()).toBeTruthy();
  });
});
