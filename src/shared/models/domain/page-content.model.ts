import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';

/**
 * One editable slot on a page - a heading, a paragraph, a picture, a button,
 * or a repeated list, in whatever combination that slot uses.
 *
 * `key` is the contract. The web template asks for a block BY KEY and falls
 * back to what it has always shown if the block is missing, so a page never
 * depends on a record existing. Keys are stable: renaming one orphans
 * whatever staff typed, which is why the admin never lets them be edited.
 *
 * `body` is HTML from the rich-text editor rather than plain text. That is
 * the whole reason this scales: a marketing page is paragraphs of prose, and
 * atomising each sentence into its own field would make a 4,500-character
 * page into forty slots nobody wants to edit. One block holds one passage.
 * Angular's [innerHTML] sanitises it on the way out.
 */
export interface PageContentBlock {
  key: string;
  heading?: string;
  /** Rich text (HTML). Rendered with [innerHTML], which sanitises. */
  body?: string;
  image?: ImageModel;
  ctaTitle?: string;
  /** An in-app route, an anchor (#history), or an absolute URL. */
  ctaUrl?: string;
  /**
   * Repeated cards, where a slot is a list rather than a passage. Shares
   * HomeSectionItem's shape so the admin edits both with one control.
   */
  items?: PageContentItem[];
  /** Switched off rather than deleted, so a block can come back. */
  isActive?: boolean;
}

/** One card in a block's list. Array order IS the running order. */
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
