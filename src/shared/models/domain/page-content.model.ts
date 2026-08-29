import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';
import { PAGE_SECTION_TYPES } from '../../lists/page_section_types.enum';

/**
 * One editable slot on a page - a heading, a paragraph, a picture, a button,
 * or a repeated list, in whatever combination that slot uses.
 *
 * THERE IS NO FALLBACK. These documents are the ONLY copy of the text they
 * hold; the duplicate that used to sit in the web templates was removed
 * when they were seeded (Shane's call, 2026-08-29), because one copy that
 * can be edited beats two that can silently disagree. A block that is
 * missing renders nothing, and a page whose document cannot be read renders
 * empty. Consequence worth carrying: page_content must exist in an
 * environment BEFORE the web build that reads it ships there.
 *
 * `key` is the stable contract for a FIXED-layout page, which asks for its
 * blocks by name. Renaming a key orphans whatever staff typed, which is why
 * the admin never lets keys be edited. A DISPATCHER page (About Us) reads
 * `type` and the array's ORDER instead, and its keys are only identity.
 *
 * `body` is HTML from the rich-text editor rather than plain text. That is
 * the whole reason this scales: a marketing page is paragraphs of prose, and
 * atomising each sentence into its own field would make a 4,500-character
 * page into forty slots nobody wants to edit. One block holds one passage.
 * Angular's [innerHTML] sanitises it on the way out.
 */
export interface PageContentBlock {
  key: string;
  /**
   * WHICH SECTION this block draws, for a page whose template is a
   * dispatcher rather than a fixed layout (About Us, 2026-08-29). The page
   * loops over `blocks` and hands each one to the renderer its type names,
   * so staff reorder sections and the site follows.
   *
   * Absent on the pages that are still fixed layouts, which ask for blocks
   * by `key` instead and ignore the array's order entirely.
   */
  type?: PAGE_SECTION_TYPES;
  heading?: string;
  /** A second, smaller heading - the label under the countries figure. */
  subheading?: string;
  /** Rich text (HTML). Rendered with [innerHTML], which sanitises. */
  body?: string;
  image?: ImageModel;
  ctaTitle?: string;
  /** An in-app route, an anchor (#history), or an absolute URL. */
  ctaUrl?: string;
  /**
   * The YouTube URL as staff pasted it, kept beside the id so the field can
   * show back what was typed. Same pairing as CoachingPageModel.
   */
  videoUrl?: string;
  /** The bare YouTube id, derived from videoUrl on save. */
  videoId?: string;
  /**
   * Repeated cards, where a slot is a list rather than a passage. Shares
   * HomeSectionItem's shape so the admin edits both with one control.
   */
  items?: PageContentItem[];
  /** Switched off rather than deleted, so a block can come back. */
  isActive?: boolean;
}

/**
 * One card in a block's list. Array order IS the running order.
 *
 * Reused for the About Us timeline, where `title` is the YEAR and
 * `description` is that year's paragraph. There is deliberately no
 * left/right field: the page alternates entries by POSITION, which is what
 * it always did, so reordering cannot leave two photos stacked on the same
 * side and there is no second source of truth to get wrong.
 */
export interface PageContentItem {
  image?: ImageModel;
  title: string;
  description?: string;
  link?: string;
  isActive: boolean;
}

/**
 * The editable content of ONE public page.
 *
 * ONE DOC PER PAGE, id = the page's route slug ('about-us', 'give', ...).
 * A singleton per page, the same shape as coaching_page and dock_bar, rather
 * than a section STACK like the home page: these pages have bespoke
 * layouts - a story column beside a picture, a three-up of course cards -
 * and a generic stack would flatten designs that were deliberately made.
 * The home page is a stack because it genuinely is one.
 *
 * WHAT IS AND IS NOT IN HERE. Words, pictures and button targets are. Page
 * STRUCTURE is not: which blocks a page has, and where they sit, stays in
 * the template. Staff change what a page says; changing what a page IS is a
 * deploy. That is the same line the Coaching with Impact page drew on
 * 2026-08-29 and it is deliberate.
 *
 * Every block is OPTIONAL at render time. A page whose document is missing,
 * unreadable, or short a block renders exactly what it rendered before this
 * existed - see the web app's PageContentService.
 */
export class PageContentModel extends BaseModel {
  blocks: PageContentBlock[] = [];
}
