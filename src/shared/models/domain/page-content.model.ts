import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';
import { PAGE_SECTION_TYPES } from '../../lists/page_section_types.enum';

/**
 * One SECTION of a page - a band a visitor meets on the way down it.
 *
 * THERE IS NO FALLBACK. These documents are the ONLY copy of the text they
 * hold; the duplicate that used to sit in the web templates was removed
 * when they were seeded (Shane's call, 2026-08-29), because one copy that
 * can be edited beats two that can silently disagree. A block that is
 * missing renders nothing, and a page whose document cannot be read renders
 * empty. Consequence worth carrying: page_content must exist in an
 * environment BEFORE the web build that reads it ships there.
 *
 * `type` and the array's ORDER are what a page draws from. `key` is only
 * identity - it keeps a list tracked and a dialog matched to the row that
 * opened it. It was a contract with the template once, when pages asked for
 * their blocks by name; every page is a dispatcher now.
 *
 * `body` is HTML from the rich-text editor rather than plain text. That is
 * the whole reason this scales: a marketing page is paragraphs of prose, and
 * atomising each sentence into its own field would make a 4,500-character
 * page into forty slots nobody wants to edit. One block holds one passage.
 * Angular's [innerHTML] sanitises it on the way out.
 *
 * NOT EVERY FIELD APPLIES TO EVERY TYPE. Which ones a type uses is declared
 * once, in the admin's page-section-catalogue.ts, and that declaration
 * drives both the editor and this comment's honesty: a field a type does not
 * list is never shown and never written.
 */
export interface PageContentBlock {
  key: string;
  /**
   * WHICH SECTION this block draws. The page loops over `blocks` and hands
   * each one to the renderer its type names, so staff reorder sections and
   * the site follows.
   *
   * Optional only because a document written before the section rework may
   * not carry one. A block with no type draws nothing.
   */
  type?: PAGE_SECTION_TYPES;
  heading?: string;
  /** A second, smaller heading - a hero's pretitle, the label under the
   *  countries figure, the year that closes the timeline. */
  subheading?: string;
  /** Rich text (HTML). Rendered with [innerHTML], which sanitises. */
  body?: string;
  /**
   * A short line BELOW the button rather than above it - the Discipleship
   * Library hero's "Free to join". Plain text; it is one line by design.
   */
  note?: string;
  image?: ImageModel;
  ctaTitle?: string;
  /** An in-app route, an anchor (#history), or an absolute URL. */
  ctaUrl?: string;
  /** A hero may carry a second button; nothing else does. */
  ctaTitle2?: string;
  ctaUrl2?: string;
  /**
   * The YouTube URL as staff pasted it, kept beside the id so the field can
   * show back what was typed. Same pairing as CoachingPageModel.
   */
  videoUrl?: string;
  /** The bare YouTube id, derived from videoUrl on save. */
  videoId?: string;
  /**
   * Repeated entries, where a section is a list rather than a passage -
   * cards, timeline entries, price tiles, the passages in a two-column
   * block. Array order IS the running order.
   */
  items?: PageContentItem[];
  /**
   * Which quotes a TESTIMONIALS section shows, IN ORDER.
   *
   * Ids into the shared `testimonials` collection rather than copies: the
   * quotes are ordinary testimonials that happen to be shown here, and
   * duplicating them would mean editing one and missing the other.
   *
   * ONLY THE ORDER lives here. Whether a quote appears is its own `isActive`,
   * because that is a property of the testimonial - so switching one off
   * removes it everywhere at once, and a newly added one appears without
   * anyone re-saving this page. An id that no longer resolves is skipped,
   * because deleting a testimonial should shorten a carousel rather than
   * leave a blank slide in it.
   */
  testimonialIds?: string[];
  /** Switched off rather than deleted, so a block can come back. */
  isActive?: boolean;
}

/**
 * One entry in a section's list.
 *
 * Deliberately ONE shape for every kind of list, so the admin edits them all
 * with one control and a section type only has to say which fields it uses.
 * `title` is the only one every kind has.
 *
 * WHAT IS NOT HERE, and why: a POSITION. No entry stores which side it lands
 * on or what number it is. The timeline alternates left and right by
 * position, the library's feature rows do the same, and their "01/02/03"
 * chips are counted at render time. A stored side is a second source of
 * truth that reordering silently breaks. `column` is the one exception and
 * it earns it - see below.
 */
export interface PageContentItem {
  image?: ImageModel;
  /** The short name: a card's title, a strip label, a timeline year. */
  title: string;
  /** A second, larger heading where an entry has both - a feature row's
   *  headline sits under its name. */
  heading?: string;
  /** Plain text, one paragraph. Use `body` where staff need formatting. */
  description?: string;
  /** Rich text (HTML) - a passage, or a bulleted list. */
  body?: string;
  link?: string;
  /**
   * Which column a COLUMNS passage sits in.
   *
   * The ONE stored position on an entry, because these two columns are not
   * an alternating pattern: the equipping pages put the facts (what it is,
   * what it costs) on the left and the pitch (why, who for, what you get)
   * on the right, in runs of two and four. Deriving that from position
   * would mean inventing a split the page does not have.
   */
  column?: 'left' | 'right';
  /**
   * A figure from Web Config to show after the title - the name of the
   * field, not the number. The AMOUNT IS NOT EDITABLE HERE on purpose:
   * prices already have one home, and a second one drifts.
   */
  amountKey?: string;
  /** What follows the amount, e.g. "/month". */
  amountSuffix?: string;
  /** A Font Awesome class, chosen from a list in the editor rather than
   *  typed - a mistyped icon renders as an empty square. */
  icon?: string;
  ctaTitle?: string;
  ctaUrl?: string;
  isActive: boolean;
}

/**
 * The editable content of ONE public page.
 *
 * ONE DOC PER PAGE, id = the page's route slug ('about-us', 'give', ...),
 * holding an ORDERED STACK of sections. Every wired page is a dispatcher:
 * it loops over `blocks` and draws each one according to its type, so staff
 * reorder, add, remove and switch off sections and the site follows with no
 * deploy.
 *
 * That is a change of position, made 2026-08-29. This model used to say
 * page STRUCTURE stayed in the template because a generic stack "would
 * flatten designs that were deliberately made". The About Us rework showed
 * the opposite: each page keeps its OWN section component, so a `story` on
 * About Us and a `mission` on the equipping pages still draw that page's
 * markup - the stack orders sections, it does not standardise them. What
 * stays in the template is what should: a payment URL, a form's Firestore
 * id, an address that already has one home in the site details.
 *
 * A page whose document is missing or unreadable renders EMPTY. There is no
 * second copy anywhere - see PageContentBlock.
 */
export class PageContentModel extends BaseModel {
  blocks: PageContentBlock[] = [];
}
