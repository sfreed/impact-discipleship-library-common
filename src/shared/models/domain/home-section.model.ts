import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';
import { HOME_SECTION_TYPES } from '../../lists/home_section_types.enum';

/**
 * One card in a services strip - a picture, a heading, a line of copy and
 * somewhere to go.
 *
 * Embedded in its section rather than given its own collection: a card has
 * no meaning away from the strip it sits in, and staff edit the strip as one
 * thing. Compare `CoachingPageModel.screenshots`, which embeds for the same
 * reason, and `coaching_page.testimonialIds`, which does NOT - a testimonial
 * is a record in its own right that a page happens to show.
 *
 * NO `order` FIELD, deliberately. The array's own order is the running
 * order. A stored number beside it would be a second source of truth, which
 * is exactly what produced the duplicate `order` values sitting in the
 * production slider today.
 */
export interface HomeSectionItem {
  image?: ImageModel;
  title: string;
  description?: string;
  /**
   * Where the picture and the READ MORE button point. An in-app path
   * ('/store'), or an absolute URL for somewhere off the site.
   */
  link?: string;
  /** Switched off rather than deleted, so a card can come back. */
  isActive: boolean;
}

/**
 * One section of the public home page, in the order a visitor meets them.
 *
 * The home page used to be a fixed stack of six components with their copy,
 * images and links written into the templates. This makes it data: staff
 * reorder sections, switch one off, add a second banner, and edit what is
 * inside each - without a deploy.
 *
 * A COLLECTION, not a singleton like `coaching_page`. Sections are added,
 * removed and reordered independently, and more than one of a type can
 * exist, so each needs to be its own record.
 *
 * WHICH FIELDS EACH TYPE USES - the model is deliberately flat rather than
 * a union, matching how `HomePageImageModel` and `CoachingPageModel` are
 * already written. Anything not listed is ignored for that type:
 *
 *   slider        - nothing. Its content is the `home_page_images`
 *                   collection; this record only says WHERE the slider sits
 *                   and whether it shows.
 *   services      - items
 *   summitBanner  - title, image (background), ctaTitle. The countdown and
 *                   the register link come from the summit EVENT, not here.
 *   video         - title, subtitle, image (the poster behind the play
 *                   button), videoUrl/videoId
 *   banner        - title, subtitle, image, ctaTitle, ctaDestination/ctaUrl
 *   subscribe     - title, subtitle, image (background). The form itself
 *                   stays in code: it posts to a Cloud Function.
 *   testimonials  - title, subtitle, testimonialIds
 *
 * ONCE-ONLY TYPES: slider, summitBanner and subscribe may appear at most
 * once. Two sliders would draw the same slides twice and there is one
 * summit. services, video and banner repeat freely. The admin enforces this
 * when offering "+ Add section"; nothing in the data does.
 */
export class HomeSectionModel extends BaseModel {
  type: HOME_SECTION_TYPES;

  /**
   * Position on the page, ascending. Written from the drag position when
   * staff reorder the stack - never typed. See the note on
   * `HomeSectionItem` for why a hand-entered order number is a trap.
   */
  order: number;

  /** Switched off rather than deleted, so a section can come back. */
  isActive = false;

  title?: string;

  /** The paragraph under the heading. */
  subtitle?: string;

  /** Background picture, feature picture or video poster, by type. */
  image?: ImageModel;

  ctaTitle?: string;

  /**
   * An in-app route for the button, or the literal 'external' to send it to
   * `ctaUrl` instead. The same pair, with the same meaning, as
   * `HomePageImageModel.ctaDestination`/`ctaUrl` - the slider taught staff
   * this convention and a second one would be gratuitous.
   */
  ctaDestination?: string;
  ctaUrl?: string;

  /**
   * The YouTube URL as staff pasted it, kept alongside the id so the field
   * can show back what was typed. Same pairing as `CoachingPageModel`.
   */
  videoUrl?: string;

  /** The bare YouTube id, derived from videoUrl on save. */
  videoId?: string;

  /** The service cards. Only `services` uses this. */
  items?: HomeSectionItem[];

  /**
   * Which testimonials this section shows, IN ORDER. Only `testimonials`
   * uses this.
   *
   * Ids into the shared `testimonials` collection rather than copies, and
   * the same split `coaching_page` uses, which is the part that matters:
   *
   *   WHETHER a quote appears is the testimonial's own `isActive`. It
   *   belongs to the testimonial, is saved the moment it is toggled, and
   *   one page's SAVE must never quietly rewrite records other pages show.
   *
   *   THE ORDER is this section's, and lives here.
   *
   * A live testimonial of the right type that is not yet in this list is
   * appended at render time, so a newly added quote appears without anyone
   * re-saving the page. An id that no longer resolves is skipped rather
   * than rendered blank.
   */
  testimonialIds?: string[];
}
