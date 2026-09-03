import {
  ALL_EVENTS_TAG,
  ALL_EVENTS_TAG_ID,
  couponOverridesSale,
  couponTagsCover
} from './coupon-scope';

// The rule both the server's checkout pricing and the web cart's coupon box
// decide eligibility by. A mismatch between the two is silent: the cart
// shows one price and the card is charged another.

describe('couponTagsCover', () => {
  const product = { id: 'prod-1' };
  const event = { id: 'event-1', isEvent: true };

  it('covers everything when the coupon has no tags', () => {
    expect(couponTagsCover(undefined, product)).toBeTrue();
    expect(couponTagsCover(null, event)).toBeTrue();
    expect(couponTagsCover([], product)).toBeTrue();
  });

  it('covers only the listed ids when tagged', () => {
    const tags = [{ id: 'prod-1' }];
    expect(couponTagsCover(tags, product)).toBeTrue();
    expect(couponTagsCover(tags, { id: 'prod-2' })).toBeFalse();
    expect(couponTagsCover(tags, event)).toBeFalse();
  });

  it('the all-events sentinel covers any event, and no product', () => {
    const tags = [ALL_EVENTS_TAG];
    expect(couponTagsCover(tags, event)).toBeTrue();
    expect(couponTagsCover(tags, { id: 'event-created-later', isEvent: true })).toBeTrue();
    expect(couponTagsCover(tags, product)).toBeFalse();
    // isEvent must be EXACTLY true - an event line is flagged by the cart,
    // and an unflagged line is a product.
    expect(couponTagsCover(tags, { id: 'x', isEvent: undefined })).toBeFalse();
  });

  it('the sentinel mixes with ordinary product tags', () => {
    const tags = [{ id: 'prod-1' }, ALL_EVENTS_TAG];
    expect(couponTagsCover(tags, product)).toBeTrue();
    expect(couponTagsCover(tags, event)).toBeTrue();
    expect(couponTagsCover(tags, { id: 'prod-2' })).toBeFalse();
  });

  it('a tag with no id never matches', () => {
    expect(couponTagsCover([{}], { id: 'undefined' })).toBeFalse();
  });

  it('the sentinel id is what the picker option carries', () => {
    // The admin dialog stores ALL_EVENTS_TAG on the coupon; the server
    // matches on ALL_EVENTS_TAG_ID. They must be the same string.
    expect(ALL_EVENTS_TAG.id).toBe(ALL_EVENTS_TAG_ID);
  });
});

describe('couponOverridesSale', () => {
  it('only a 100% coupon beats a sale', () => {
    expect(couponOverridesSale(100)).toBeTrue();
    expect(couponOverridesSale(150)).toBeTrue();
    expect(couponOverridesSale(99.9)).toBeFalse();
    expect(couponOverridesSale(0)).toBeFalse();
  });

  it('a malformed percent never overrides', () => {
    expect(couponOverridesSale(null)).toBeFalse();
    expect(couponOverridesSale(undefined)).toBeFalse();
    expect(couponOverridesSale('100')).toBeFalse();
    expect(couponOverridesSale(NaN)).toBeFalse();
  });
});
