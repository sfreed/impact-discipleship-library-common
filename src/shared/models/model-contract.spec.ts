import { BaseModel } from './base.model';
import { CoachModel } from './domain/coach.model';
import { CourseModel } from './domain/course.model';
import { DMMModel } from './domain/dmm.model';
import { DockBarModel } from './domain/dock-bar.model';
import { EventRegistrationModel } from './domain/event-registration.model';
import { FormDefinitionModel } from './domain/form-definition.model';
import { FormSubmissionModel } from './domain/form-submission.model';
import { HomePageImageModel } from './domain/home-page-image.model';
import { ImpactTeamMemberModel } from './domain/impact-team-member.model';
import { LocationModel } from './domain/location.model';
import { OrganizationModel } from './domain/organization.model';
import { PodCastModel } from './domain/pod-cast.model';
import { ShippingLabelBatchRequest } from './domain/shipment-label-batch-request.model';
import { TagModel } from './domain/tag.model';
import { TestimonialModel } from './domain/testimonial.model';
import { TrainingRoomModel } from './domain/training-room.model';
import { Address } from './domain/utils/address.model';
import { AgendaItem } from './domain/utils/agenda-item.model';
import { Phone } from './domain/utils/phone.model';
import { AffilliateSaleModel } from './utils/affilliate-sale.model';
import { CouponModel } from './utils/coupon.model';
import { FAQModel } from './utils/faq.model';
import { ImageModel } from './utils/image.model';
import { ProductModel } from './utils/product.model';
import { SeriesModel } from './utils/series.model';
import { WebConfigModel } from './utils/web-config.model';

/**
 * Contract tests for the shared domain models.
 *
 * These classes are what every app writes to Firestore, so two things about
 * a freshly constructed instance genuinely matter, and neither is checked
 * anywhere else:
 *
 *  1. Its DEFAULTS. `isActive = false` is a safety default - a product,
 *     coupon or testimonial that defaulted to active would publish itself
 *     the moment it was created. Only ten of these models carry any runtime
 *     state at all, and it is almost entirely defaults of that shape.
 *
 *  2. That it has NO `undefined`-valued own properties. The Firestore client
 *     SDK rejects `undefined` field values outright ("Unsupported field
 *     value: undefined"), so a model that emitted one would break every
 *     create through FirebaseDAO.add(). Today this holds because
 *     tsconfig sets `useDefineForClassFields: false`, which makes a bare
 *     `name: string;` declaration emit no runtime code whatsoever. Flip that
 *     flag - or adopt a preset that flips it - and EVERY declared field
 *     becomes an own property set to undefined, breaking every write in all
 *     three apps at once. That is a silent, build-time-clean, catastrophic
 *     regression, which is exactly what a test should stand in front of.
 */

interface ModelCase {
  name: string;
  create: () => object;
  /** Only the fields the class actually initialises. */
  defaults: Record<string, unknown>;
  extendsBase: boolean;
}

const CASES: ModelCase[] = [
  // --- carry real defaults -------------------------------------------
  {
    name: 'ProductModel',
    create: () => new ProductModel(),
    defaults: {
      isActive: false,
      cost: 0,
      salePrice: 0,
      isEBook: false,
      isDigitalBook: false,
      sizes: [],
      colors: [],
      languages: [],
    },
    extendsBase: true,
  },
  {
    name: 'CouponModel',
    create: () => new CouponModel(),
    defaults: { isActive: false, isAffilliate: false },
    extendsBase: true,
  },
  {
    name: 'AffilliateSaleModel',
    create: () => new AffilliateSaleModel(),
    defaults: { isPayed: false },
    extendsBase: true,
  },
  {
    name: 'CoachModel',
    create: () => new CoachModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'DMMModel',
    create: () => new DMMModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'DockBarModel',
    create: () => new DockBarModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'HomePageImageModel',
    create: () => new HomePageImageModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'ImpactTeamMemberModel',
    create: () => new ImpactTeamMemberModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'PodCastModel',
    create: () => new PodCastModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'TestimonialModel',
    create: () => new TestimonialModel(),
    defaults: { isActive: false },
    extendsBase: true,
  },
  {
    name: 'EventRegistrationModel',
    create: () => new EventRegistrationModel(),
    defaults: { loggedIn: false },
    extendsBase: true,
  },

  // --- no runtime state: declarations only ----------------------------
  { name: 'BaseModel', create: () => new BaseModel(), defaults: {}, extendsBase: false },
  { name: 'CourseModel', create: () => new CourseModel(), defaults: {}, extendsBase: true },
  { name: 'FormDefinitionModel', create: () => new FormDefinitionModel(), defaults: {}, extendsBase: true },
  { name: 'FormSubmissionModel', create: () => new FormSubmissionModel(), defaults: {}, extendsBase: true },
  { name: 'LocationModel', create: () => new LocationModel(), defaults: {}, extendsBase: true },
  { name: 'OrganizationModel', create: () => new OrganizationModel(), defaults: {}, extendsBase: true },
  { name: 'TagModel', create: () => new TagModel(), defaults: {}, extendsBase: true },
  { name: 'TrainingRoomModel', create: () => new TrainingRoomModel(), defaults: {}, extendsBase: true },
  { name: 'SeriesModel', create: () => new SeriesModel(), defaults: {}, extendsBase: true },
  { name: 'FAQModel', create: () => new FAQModel(), defaults: {}, extendsBase: true },
  { name: 'WebConfigModel', create: () => new WebConfigModel(), defaults: {}, extendsBase: true },
  { name: 'ShippingLabelBatchRequest', create: () => new ShippingLabelBatchRequest(), defaults: {}, extendsBase: false },
  { name: 'ImageModel', create: () => new ImageModel(), defaults: {}, extendsBase: false },
  { name: 'Address', create: () => new Address(), defaults: {}, extendsBase: false },
  { name: 'AgendaItem', create: () => new AgendaItem(), defaults: {}, extendsBase: false },
  { name: 'Phone', create: () => new Phone(), defaults: {}, extendsBase: false },
];

describe('shared domain models', () => {
  describe('declared defaults', () => {
    for (const c of CASES.filter((x) => Object.keys(x.defaults).length > 0)) {
      it(`${c.name} initialises its documented defaults`, () => {
        const instance = c.create() as Record<string, unknown>;
        for (const [key, expected] of Object.entries(c.defaults)) {
          expect(instance[key]).toEqual(expected as never, `${c.name}.${key}`);
        }
      });
    }

    it('every isActive-style flag defaults to OFF, never on', () => {
      // The safety direction is the whole point: a record that defaulted to
      // active would publish itself to the public site on creation.
      for (const c of CASES) {
        const instance = c.create() as Record<string, unknown>;
        for (const flag of ['isActive', 'isPayed', 'loggedIn']) {
          if (flag in instance) {
            expect(instance[flag]).withContext(`${c.name}.${flag}`).toBe(false);
          }
        }
      }
    });

    it('array defaults are per-instance, not shared across instances', () => {
      // A class field initialiser runs per construction, so two products
      // must not share one sizes array - if they did, pushing a size onto
      // one product would silently alter every other.
      const a = new ProductModel();
      const b = new ProductModel();
      a.sizes!.push('L');
      expect(b.sizes).toEqual([]);
    });
  });

  describe('Firestore write safety', () => {
    it('no freshly constructed model carries an undefined-valued property', () => {
      // Firestore rejects the ENTIRE write if any field is explicitly
      // undefined - see the admin app's own strip-undefined.ts, whose header
      // documents the same trap. That helper is applied at only four call
      // sites (the email designer, campaign offers); FirebaseDAO.add() has
      // no such guard, so for every other collection the model itself is
      // the only thing standing between a stray undefined and a failed save.
      const offenders: string[] = [];
      for (const c of CASES) {
        const instance = c.create() as Record<string, unknown>;
        for (const [key, value] of Object.entries(instance)) {
          if (value === undefined) offenders.push(`${c.name}.${key}`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it('a model with no initialisers constructs to an empty object', () => {
      // Bare `name: string;` declarations emit nothing under
      // useDefineForClassFields:false. This pins that compiler behaviour
      // directly, so the flag flipping fails HERE with an obvious message
      // rather than as a runtime Firestore error in production.
      expect(Object.keys(new SeriesModel())).toEqual([]);
      expect(Object.keys(new ImageModel())).toEqual([]);
      expect(Object.keys(new TagModel())).toEqual([]);
    });
  });

  describe('BaseModel inheritance', () => {
    it('models that extend BaseModel accept an id', () => {
      // FirebaseDAO stamps `id` from the document reference on read, so the
      // property has to exist on the type for every collection-backed model.
      for (const c of CASES.filter((x) => x.extendsBase)) {
        const instance = c.create() as BaseModel;
        expect(instance instanceof BaseModel).withContext(c.name).toBe(true);
        instance.id = 'doc-id';
        expect(instance.id).toBe('doc-id');
      }
    });

    it('id is absent until something sets it', () => {
      // It must not be an own property on a new instance - see the
      // undefined-value test above; an `id: undefined` would be rejected by
      // Firestore on create.
      expect('id' in new ProductModel()).toBe(false);
    });
  });
});
