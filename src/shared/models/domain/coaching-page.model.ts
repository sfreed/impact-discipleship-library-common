import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';

/**
 * One screenshot in the "A movement of multiplication" grid on the Coaching
 * with Impact page - the Zoom-group shots that run alongside the online copy.
 */
export interface CoachingScreenshot {
  image?: ImageModel;
  order: number;
  /** Switched off rather than deleted, so a shot can come back. */
  isActive: boolean;
}

/**
 * The editable content of the public Coaching with Impact page.
 *
 * A SINGLETON, like the docking bar's config - one record, saved in place,
 * not a list. Everything on that page used to be hardcoded in the web repo's
 * CoachingWithImpactComponent (rebuilt from a WordPress export 2026-08-23);
 * this is the part staff asked to change without a deploy.
 *
 * Deliberately NOT here, and still in code: the hero image, the two book
 * covers, the group photo, the Kajabi consultation link and the product/team
 * routes. Those do not change, and a link that breaks in code fails to
 * compile rather than failing quietly on the page (owner's call, 2026-08-29).
 */
export class CoachingPageModel extends BaseModel {
  /**
   * The YouTube URL as staff pasted it. Kept alongside the id so the field
   * can show back what was typed rather than an id nobody recognises.
   */
  videoUrl?: string;

  /**
   * The bare YouTube id, which is what <youtube-player> needs. Derived from
   * videoUrl on save (see parseVideoUrl) so the public page never has to
   * parse anything at render time.
   */
  videoId?: string;

  /**
   * Which testimonials appear on this page, IN ORDER.
   *
   * Ids into the shared `testimonials` collection rather than copies: the
   * quotes are ordinary testimonials that happen to be shown here, and
   * duplicating them would mean editing one and missing the other. Order is
   * this list's order - `testimonials` has no page-specific ordering and
   * should not grow one.
   *
   * An id that no longer resolves is skipped rather than rendered blank; see
   * the web component.
   */
  testimonialIds: string[] = [];

  /** The "A movement of multiplication" grid, in `order`. */
  screenshots: CoachingScreenshot[] = [];
}
