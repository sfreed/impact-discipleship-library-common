import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';
import { PAGE_SECTION_TYPES } from '../../lists/page_section_types.enum';
import { PageTheme, SECTION_ARCHETYPE, SectionSurface } from '../../lists/section_kit';

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
   * TWO VOCABULARIES, DELIBERATELY, while both exist (2026-08-30):
   *
   *   PAGE_SECTION_TYPES  - the twelve original pages. Each has its own
   *                         section component, which is why `banner` can be
   *                         a photo slider on one page and a tinted band on
   *                         another; the name only has to be unique within
   *                         that component.
   *   SECTION_ARCHETYPE   - pages staff created, drawn by the shared kit.
   *                         No bespoke component exists for them, so a name
   *                         has to mean ONE thing everywhere.
   *
   * The union is not a permanent shape. It is what a migration LOOKS like
   * while it is half done, and writing it out is better than a cast that
   * hides which pages are on which side.
   *
   * THE TWO VOCABULARIES OVERLAP, and where they do it is the same thing
   * twice: 'timeline' and 'form' are both a PAGE_SECTION_TYPE and a
   * SECTION_ARCHETYPE. That is not a collision to resolve - it means those
   * blocks need NO migration at all, because the value they already store is
   * the value the kit wants. `section_kit.spec.ts` pins it: any string in
   * both enums must map to itself in LEGACY_RENDERINGS, so an overlap that
   * ever meant two different things would fail rather than silently draw the
   * wrong section.
   *
   * Nothing has to disambiguate at runtime in any case. A block reaches
   * exactly one renderer - the one its PAGE routes to - and a renderer
   * ignores what it does not know, which is what all ten already do.
   *
   * Optional only because a document written before the section rework may
   * not carry one. A block with no type draws nothing.
   */
  type?: PAGE_SECTION_TYPES | SECTION_ARCHETYPE;
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
   * WHICH LOOK, within the type. Added 2026-08-30 with the section kit.
   *
   * The STRUCTURAL axis - the video sits beside the copy or below it; a
   * hero's buttons are two fixed slots or a list. No amount of styling turns
   * one into the other, which is what separates this from `surface`.
   *
   * Absent means the type's first variant, so a block written before this
   * existed draws the default rather than nothing. See SECTION_KIT.
   */
  variant?: string;

  /**
   * WHAT GROUND it is drawn on - light, dark, the brand tint, or its own
   * photo. The COLOUR axis, and never structural.
   *
   * Absent, or 'inherit', means whatever the page's theme says, so a page
   * reads as one thing until somebody deliberately breaks the run. About Us
   * runs a dark history band between light story columns, which is why this
   * lives on the SECTION at all rather than only on the page.
   */
  surface?: SectionSurface;

  /**
   * TEXT STYLE OPTIONS - kit pages only, added 2026-08-30 when Shane
   * compared Lunch and Learns and wanted the copy "as close as we can" to
   * the original, but with the differences as choices rather than fate.
   *
   * All three DEFAULT (absent) to the site's own measured style - Lato 900
   * heading over a wide 5px rule, #848b8a copy, grey dot bullets - so a
   * migrated page looks like itself until somebody chooses otherwise. Small
   * closed unions, not free styling: a font box would be a second web
   * designer inside every editor.
   */
  /** 'bold' = Lato 900 at 50px (the mission bands); 'light' = the SAME 50px
   *  at weight 500 (the site's own prose headings - OVERVIEW is 50/500);
   *  'standard' = the kit's smaller 32/500. Absent = bold. */
  headingStyle?: 'bold' | 'light' | 'standard';
  copyTone?: 'soft' | 'dark';
  bullets?: 'dots' | 'none';
  /** The site's TWO measured copy scales: 'large' = 20px/40 running wide
   *  (the OVERVIEW passages), 'compact' = 14px/24 (copy beside media),
   *  'display' = the 40px/60 statement lines (the Give page's centred line).
   *  Absent = compact. */
  copySize?: 'large' | 'compact' | 'display';
  /** How much room the media half of a split section takes: 'large' matches
   *  the original pages (video ~700px of a 1600 screen), 'balanced' is an
   *  even split. Absent = large. */
  mediaSize?: 'large' | 'balanced';
  /** Which part of a background PHOTO stays in view when the band crops it -
   *  'top' keeps faces, 'bottom' keeps foregrounds. Photo surfaces only.
   *  Absent = center. (Shane's About Us verdict: the history banner cropped
   *  everyone's heads off.) */
  photoFocus?: 'top' | 'center' | 'bottom';

  /**
   * CARD GROUNDS - a box painted behind a card or a column, from the same
   * fixed palette as everything else. NOT a colour picker, deliberately:
   * Shane's own follow-up was "then we'd have to let them change the text
   * colours too", and that coupling is exactly what a palette solves - each
   * ground defaults its ink to what reads on it, and the ink is its own
   * small lever ('dark' | 'light') rather than a wheel.
   *
   * 'brand' is the equipping pages' blue box (#588AC7). Its default ink is
   * LIGHT - a deliberate departure: the original ran grey copy on the blue
   * at ~1.4:1, which Shane's review called terrible, and Dark text remains
   * one click away. leftGround/rightGround card the two columns of a
   * LIST_COLUMNS; cardGround cards every tile of a LIST_GRID. Absent = no
   * box.
   */
  cardGround?: 'none' | 'panel' | 'brand' | 'dark';
  cardInk?: 'dark' | 'light';
  leftGround?: 'none' | 'panel' | 'brand' | 'dark';
  leftInk?: 'dark' | 'light';
  rightGround?: 'none' | 'panel' | 'brand' | 'dark';
  rightInk?: 'dark' | 'light';
  /** A column's passage HEADINGS in the brand blue - the original audience
   *  pages run their right-side questions in #588AC7. Absent = ink. */
  leftTitleTone?: 'ink' | 'brand';
  rightTitleTone?: 'ink' | 'brand';
  /** How many cards a tile section puts on a row before wrapping. Absent =
   *  as many as fit. Seminars' picture cards run 2-and-2. */
  cardsPerRow?: 2 | 3 | 4;
  /** This section SHARES A ROW with the one after it, half and half - the
   *  Contact page's two parallel halves. Falls back to stacking on phones,
   *  and quietly stacks when there is no next section to pair with. */
  pairWithNext?: boolean;

  /**
   * WHICH Form Builder form a FORM section shows. KIT PAGES ONLY - on the
   * twelve original pages the id stays in the page component.
   *
   * Stored because a builder page has no component to keep it in, and PICKED
   * because the original rule's rationale was never "no stored id" but "no
   * typing" - a Firestore id retyped into a text box is a blank widget
   * nobody can diagnose. The editor offers the forms that exist, by name.
   * Approved 2026-08-30.
   */
  formId?: string;

  /**
   * WHICH mailing list a sign-up section joins. The web app's
   * SubscriptionType union, chosen from SIGNUP_LISTS - a fixed choice,
   * stored by key, never typed, same pattern as the giving buttons.
   */
  signupList?: 'newsletter' | 'prayer';

  /**
   * WHICH SIDE the picture or video sits on, where a section has both text
   * and media.
   *
   * A SETTING, not a variant (owner, 2026-08-31). It used to be fixed by the
   * variant - "text with a video" always put the video on the right - or
   * alternated by position down a list. Both are still the DEFAULT when this
   * is unset, so nothing that was never touched moves; but a section can now
   * be told, and staff do not have to pick a different look to get a picture
   * on the left.
   */
  mediaSide?: 'left' | 'right';

  /**
   * Whether the passage comes BEFORE the heading rather than after it.
   *
   * The stacked equivalent of mediaSide: "heading and text" is the usual
   * order, and this is how a section says "text, then heading" without
   * needing a variant of its own.
   */
  textFirst?: boolean;

  /**
   * What a COUNTDOWN counts toward, as an ISO date string ('2027-02-05' or a
   * full timestamp).
   *
   * A STRING, not a Firestore Timestamp, on purpose: this document is edited
   * whole by the section editor and read by three apps, and MIGRATION.md
   * already carries a running list of date fields that arrive in three
   * different shapes. One text shape that every consumer parses the same way
   * is worth more here than a native type.
   *
   * A date that cannot be parsed, or one already past, draws no clock rather
   * than a row of zeros or a negative count - see the renderer.
   */
  targetDate?: string;

  /**
   * THE COLUMNS a `section` block is built from - one to three, each an
   * ordered list of pieces. See ContentPiece at the foot of this file.
   *
   * Present ONLY on the new `section` type. Every block written before
   * 2026-08-31 carries the flat fields above instead, and both shapes
   * render until the last page has migrated.
   */
  columns?: SectionColumn[];

  /**
   * Repeated entries, where a section is a list rather than a passage -
   * cards, timeline entries, price tiles, the passages in a two-column
   * block. Array order IS the running order.
   *
   * On the new `list` type these are THE list. On the new `section` type
   * they are unused - a section's buttons live on a buttons PIECE, which is
   * what unpicks the old overload where this one field meant list data on
   * six archetypes and buttons on five.
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

  // ------------------------------------------- pages staff create themselves
  //
  // Everything below is undefined on the TWELVE ORIGINAL PAGES and must stay
  // optional because of it. Those pages have a hand-written route, a nav leaf
  // and a component; a page created in the admin has none of those, so it has
  // to carry what a route would otherwise have supplied.
  //
  // A document with no `title` is one of the original twelve. That is the
  // only thing distinguishing them, and it is deliberate - a `isBuilderPage`
  // flag would be a second source of truth that a migration could set wrong.

  /**
   * What the browser tab says and what the Navigation picker offers.
   *
   * Not the page's HEADING - the hero carries its own, and they are often
   * different: a page titled "Equipping Pastors" opens with "Equip the men
   * who equip everyone else".
   */
  title?: string;

  /**
   * The page's prevailing look. A section drawn on 'inherit' gets this.
   *
   * On the page rather than only on each section because a page dressed one
   * band at a time is a page nobody finishes.
   */
  theme?: PageTheme;

  /**
   * Whether a VISITOR can reach it. Absent counts as published, so the
   * twelve original pages - which have no such flag - are unaffected.
   *
   * A page being built is reachable by anyone who guesses its URL otherwise,
   * and half-written copy on the public site is worse than no page at all.
   */
  isPublished?: boolean;
}

// ---------------------------------------------------- columns and pieces
//
// THE SHAPE EVERY SECTION IS MOVING TO (Stage 1, 2026-08-31).
//
// The fourteen archetypes above each fix their own layout and declare which
// of this block's ~35 flat fields they use. That worked while the layouts
// came from a census of twelve real pages, and stopped working the moment
// the owner wanted arrangements nobody had drawn yet.
//
// A SECTION is one to three columns; a column is an ordered list of PIECES.
// Everything the fourteen archetypes draw is a piece, and every piece here
// already existed as a field - this is a rearrangement of the same content,
// not new capability.
//
// NOTHING READS THESE YET on the twelve pages plus Home: the flat fields
// stay, both shapes render, and a block carries one or the other. They are
// removed only when the last page has migrated.

/** What a piece IS. The value is stored, so rename a member freely and a
 *  value never. */
export type ContentPieceKind =
  /** A heading, at a level - see ContentPiece.level. */
  | 'heading'
  /** The small line above a heading. */
  | 'eyebrow'
  /** A rich-text passage. */
  | 'text'
  /** A picture drawn as content, not as a ground. */
  | 'picture'
  /** A click-to-play YouTube video. */
  | 'video'
  /** One or more buttons. A LIST, so a third is an add. */
  | 'buttons'
  /** A form built in Form Builder, chosen by name. */
  | 'form'
  /** The fixed name-and-email sign-up. A DIFFERENT thing from `form`: the
   *  fields belong to the site, only the mailing list is data. */
  | 'signup'
  /** A clock counting to a date the piece carries. */
  | 'countdown'
  /** The address, phone, email and social links, from Web Config. Editable
   *  nowhere but Web Config, which is why it is one piece and not six. */
  | 'siteDetails'
  /** A figure NAMED from Web Config. Never a typed number - a price with two
   *  homes drifts, and a page is not its home. */
  | 'price'
  /** A small line, quieter than body text. */
  | 'note';

/**
 * ONE piece of content inside a column.
 *
 * Flat and all-optional, the same choice PageContentItem makes: one shape
 * every piece editor can bind to, rather than a discriminated union that
 * would make every reused control's binding path depend on the kind.
 */
export interface ContentPiece {
  /** Stable within its column. What a drag reorders and an editor tracks. */
  key: string;
  kind: ContentPieceKind;
  /** Absent counts as live, the same rule as sections and entries. */
  isActive?: boolean;

  /** heading, eyebrow, note. */
  text?: string;
  /**
   * Which heading this is.
   *
   * 'page' renders the <h1>. It used to be guaranteed by the hero archetype
   * being a singleton; with any section able to hold any heading it has to
   * be said out loud, and the page editor can then check there is exactly
   * one - which is more than the old arrangement could do.
   *
   * 'display' is the odd one: still an ordinary section heading to a screen
   * reader, drawn at figure size. It is what made the photo band's `figure`
   * variant its own arrangement - a large number beside a paragraph - and it
   * is a SIZE rather than a rank, which is why it does not change the tag.
   */
  level?: 'page' | 'section' | 'minor' | 'display';

  /** text - rich HTML, as body always has been. */
  html?: string;

  /** picture. */
  image?: ImageModel;
  photoFocus?: 'top' | 'center' | 'bottom';

  /** video - the id, parsed from a pasted URL by the editor. */
  videoId?: string;

  /** buttons. Reuses PageContentItem so href() resolution, the destination
   *  picker and the entry editor all work unchanged. */
  buttons?: PageContentItem[];

  /** form - a Firestore id, PICKED from the forms that exist, never typed. */
  formId?: string;
  /**
   * form - what its submit button says.
   *
   * The FORM archetype kept this in `ctaTitle`, which reads like a link and
   * is not one: it is the label on the form's own submit button. The
   * comparison screen caught it going missing the first time this migration
   * ran - "GET MY FREE CONSULTATION" quietly became "Submit", which is
   * exactly the kind of loss that looks like nothing at all.
   */
  submitLabel?: string;
  /** signup. */
  signupList?: 'newsletter' | 'prayer';
  /** countdown - ISO date. Absent, unreadable or past draws no clock. */
  targetDate?: string;
  /** price - names a Web Config figure; the suffix is free text ("/seat"). */
  amountKey?: string;
  amountSuffix?: string;
}

/** One column of a section. */
export interface SectionColumn {
  key: string;
  /**
   * A painted box behind this column, from the fixed palette.
   *
   * REPLACES leftGround/leftInk/leftTitleTone and their right-hand twins -
   * six fields that encoded "this section has two columns with their own
   * colours" without ever admitting there were columns.
   */
  ground?: 'none' | 'panel' | 'brand' | 'dark';
  ink?: 'dark' | 'light';
  /** Headings in this column drawn in the brand blue - the audience pages'
   *  right-hand questions. */
  titleTone?: 'ink' | 'brand';
  /**
   * This column spans the whole row rather than taking a share of it.
   *
   * A HEADING ABOVE THE COLUMNS is the reason this exists, and it is not a
   * special case: nearly every two-column band on the site has one, and the
   * old model expressed it by giving the SECTION a heading field that the
   * columns then sat under. Making it a full-width column instead keeps one
   * rule - a section is columns of pieces - and costs one boolean, where a
   * spanning heading field would have been a second way to say "content"
   * that only ever worked at the top.
   *
   * It does not count towards how many columns the row has: three columns
   * with a heading over them is a three-column section, not four.
   */
  full?: boolean;
  /**
   * Text centred rather than ranged left.
   *
   * The centred band was an ARCHETYPE - one of the fourteen - and the only
   * thing that made it one was this. Made a column property, it stops being
   * a kind of section and becomes something any column can be.
   */
  align?: 'centre';
  /**
   * Hold this column to a READABLE WIDTH rather than letting it run the
   * whole track.
   *
   * Both single-column bands on the site do this and it is the reason the
   * first comparison showed the migrated hero running its copy the full
   * screen width: measured at 840px on the hero and 70 characters on a
   * centred passage, and the kit let both run edge to edge, which Shane
   * called out on sight the first time round. A column that spans the row
   * needs it most, which is exactly when nothing else constrains it.
   */
  measure?: boolean;
  /**
   * Indent this column's contents off the page gutter.
   *
   * The contact details are why it exists (Shane, 2026-08-31): flush against
   * the gutter they read as forgotten rather than placed. It is a COLUMN
   * lever rather than padding on the details themselves because the old
   * archetype wraps its heading in that block and a migrated section does
   * not - padding the block would move the heading on one side only, and the
   * comparison would show a difference the change never intended.
   */
  inset?: boolean;
  pieces: ContentPiece[];
}
