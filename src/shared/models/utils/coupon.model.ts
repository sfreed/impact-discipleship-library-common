import { Timestamp } from "firebase/firestore";
import { BaseModel } from "../base.model"
import { TagModel } from "../domain/tag.model";

export class CouponModel extends BaseModel {
  isActive = false;
  code: string;
  isAffilliate = false;
  affilliateName: string;
  affiliatePaypalAccount: string;
  percentOff: number | null;
  /**
   * When this code stops working (Campaign Manager v3, 2026-08-22).
   *
   * Absent means no expiry, which every coupon written before this was.
   * A campaign-issued coupon always has one: it inherits the campaign end
   * date, or the admin is made to pick one when the campaign is open-ended -
   * otherwise a signup reward stays redeemable for years.
   *
   * Enforced SERVER-SIDE in findCouponByCode, which reports an expired
   * coupon as inactive, so no storefront bundle has to be updated to honour
   * it and no client can skip the check.
   */
  expiresAt?: Timestamp | Date | string | null;
  tags?: TagModel[];
}
