import { PAGE_SECTION_TYPES } from './page_section_types.enum';

/**
 * THE SECTION KIT - one set of sections able to draw every public page.
 *
 * DRAFT, 2026-08-30. Nothing consumes this yet. It is the vocabulary a
 * general page builder needs: a page created in the admin has no bespoke
 * component to draw it, so it has to be built from sections that render
 * anywhere.
 *
 * WHY THIS EXISTS AT ALL. Today each page owns its own section component and
 * its own `@switch (block.type)`, which is why `banner` is a full-width photo
 * slider on About Us and a tinted call-to-action block on Coaching. That is a
 * deliberate design and it works - right up until a page exists that nobody
 * wrote a component for. Then a type name has to mean ONE thing.
 *
 * WHAT THE CENSUS FOUND, and what this file is built on. The nine section
 * components hold 38 rendered cases between them, and they collapse to
 * FOURTEEN layouts. Three of the seven heroes are the same `<app-header>`
 * with identical bindings; four of the five `mission` renderings are
 * copy-beside-video differing only in the rule under the heading. The
 * differences that remain fall into exactly two kinds, which is why this file
 * has exactly two axes beyond the archetype:
 *
 *   VARIANT  - a STRUCTURAL difference. The video sits beside the copy or
 *              below it; a hero's buttons are two fixed slots or a list. No
 *              amount of styling turns one into the other.
 *   SURFACE  - a COLOUR difference. The same layout on a light ground, a dark
 *              ground, a tint, or over a photo. Nothing structural changes.
 *
 * Keeping those apart is the whole trick. Collapse them into one "variant"
 * and every new colour becomes a new layout; separate them and About Us's
 * dark band is the same section as the equipping pages' light one.
 *
 * SURFACE IS A SECTION FIELD WITH A PAGE DEFAULT, not a page-wide setting.
 * About Us runs a dark mission band between light story columns, so a page
 * cannot be one colour - but almost every page has a prevailing one, and
 * making staff set it per section would be forty decisions instead of one.
 *
 * WHAT IS DELIBERATELY NOT HERE. Every behaviour the census found living in
 * markup stays in markup: which hosted payment page a giving button opens
 * (resolved by key - a free-text URL here would let anyone who can edit a
 * page redirect donations), which Web Config figure a price names, which
 * Form Builder form a section shows, where the reader-app button goes, and
 * which collection the quote carousel reads. A page builder must not become
 * a way to point money somewhere else.
 */

// ---------------------------------------------------------------- archetypes

/**
 * The fourteen layouts. These are RENDERERS: one component each, eventually.
 *
 * The values are what would sit in `page_content.blocks[].type` after a
 * migration, so they follow the existing enum's rule - rename a member
 * freely, never a value.
 */
export enum SECTION_ARCHETYPE {
  /** A background photo with a pretitle, title, copy and buttons over it.
   *  Six of today's cases; five already share `<app-header>`. */
  HERO_BAND = 'heroBand',
  // HERO_SPLIT was here until 2026-08-31. It was the same THING as HERO_BAND
  // - the page's <h1>, one per page - in a different layout, which is what a
  // variant is for. It is `heroBand` with variant `besidePicture` now, and
  // existing sections were migrated by scripts/merge-hero-split.js.
  /** A heading and a passage beside an image or a click-to-play video.
   *  The largest family on the site. */
  COPY_MEDIA = 'copyMedia',
  /** A heading, usually a rule, a passage, sometimes buttons - full width
   *  and centred. What separates today's seven is almost entirely ground
   *  colour, which is why they are one archetype and not seven. */
  COPY_CENTRED = 'copyCentred',
  /** A full-width photo with words over it and nothing beside it. */
  PHOTO_BAND = 'photoBand',
  /** One row per item: something to click on the left, a line of
   *  explanation on the right. */
  LIST_ROWS = 'listRows',
  /** Repeated tiles in a grid. */
  LIST_GRID = 'listGrid',
  /** A full-width row per item, media on alternating sides. */
  LIST_ARTICLES = 'listArticles',
  /** Headed passages in two columns, where the column is STORED on the
   *  entry because the columns say different kinds of thing. */
  LIST_COLUMNS = 'listColumns',
  /** Dated entries down a centre line. */
  TIMELINE = 'timeline',
  /** A slider of quotes from the shared `testimonials` collection. */
  CAROUSEL = 'carousel',
  /** Words wrapped around a form the SITE owns. Which form is never data. */
  FORM = 'form',
  /** The address, email, phone and social links, from Web Config. */
  CONTACT_DETAILS = 'contactDetails',
  // FIXED_BAND was here until 2026-08-31. It existed for ONE band - the
  // consultation banner - whose words, picture and button were hardcoded in
  // the web app, so a section that nobody could edit was the best the kit
  // could offer. A photo band with buttons is the same thing and editable,
  // which is the whole point of the builder. Migrated by
  // scripts/merge-consultation-band.js.
  /** Full-width slides that rotate: a picture, words over it, a button.
   *  The home page's own slider, as a section any page can have (2026-08-31). */
  SLIDER = 'slider',
  /** A clock counting down to a DATE the section carries. */
  COUNTDOWN = 'countdown',

  // ------------------------------------------------ the two that replace them
  //
  // Stage 1 of the consolidation (2026-08-31). These sit BESIDE the fourteen
  // above and nothing uses them yet: no page has been migrated and no
  // archetype removed, so this ships dark and there is nothing to undo.
  //
  /** ONE TO THREE COLUMNS, each an ordered list of content pieces. Absorbs
   *  the eight COMPOSED archetypes - hero, copy beside media, heading and
   *  text, photo band, two columns, contact details, form and countdown. */
  SECTION = 'section',
  /** ONE ITEM SHAPE REPEATED, with a look. Absorbs the six REPEATERS - tiles,
   *  rows, alternating articles, timeline, quote carousel and slides. A
   *  repeater is not a column: twelve tiles are not twelve columns, and three
   *  of them carry per-item state (alternation, counted chips, rotation) that
   *  a column model has nowhere to put. */
  LIST = 'list'
}

// ------------------------------------------------------------------ surfaces

/**
 * The ground a section is drawn on. The COLOUR axis - never structural.
 *
 * `inherit` means "whatever the page's theme says", and is the default for
 * every section, so a page reads as one thing until somebody deliberately
 * breaks the run.
 */
export type SectionSurface =
  | 'inherit'
  /** White or near-white. The site's default band. */
  | 'light'
  /** The dark band - About Us's history section, the reader hero. */
  | 'dark'
  /** The brand tint. Coaching's closing block, the Library's blue foot. */
  | 'tinted'
  /** The section's own `image` as a background, with text over it. */
  | 'photo';

export const SECTION_SURFACES: readonly { key: SectionSurface; label: string }[] = [
  { key: 'inherit', label: 'Same as the page' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'tinted', label: 'Brand tint' },
  { key: 'photo', label: 'Over the photo' }
];

/**
 * A page's prevailing look.
 *
 * ON THE PAGE, not the section, because a page that has to be dressed one
 * band at a time is a page nobody will finish. A section overrides it with
 * its own `surface` where a run needs breaking.
 */
export interface PageTheme {
  /** What a section drawn on `inherit` gets. */
  surface: Exclude<SectionSurface, 'inherit'>;
  /**
   * Whether alternating sections flip between light and dark automatically.
   *
   * The Library's feature rows already do this per ENTRY (`dl-row--alt`).
   * At page level it is what makes a long stack readable without anyone
   * setting a colour forty times.
   */
  banding?: boolean;
}

export const DEFAULT_PAGE_THEME: PageTheme = { surface: 'light', banding: false };

// ------------------------------------------------------------------ variants

/** Which of a block's own fields an archetype variant uses. Mirrors the
 *  admin catalogue's PageSectionFields - the same declaration drives the
 *  editor and the renderer. */
export interface KitFields {
  heading?: boolean;
  subheading?: boolean;
  body?: boolean;
  note?: boolean;
  image?: boolean;
  cta?: boolean;
  cta2?: boolean;
  video?: boolean;
  entries?: boolean;
  testimonials?: boolean;
  /**
   * WHICH Form Builder form this section shows, stored as `formId`.
   *
   * A relaxation of the original rule, approved 2026-08-30. On the twelve
   * original pages the id lives in the page component, because "a Firestore
   * id retyped into a text box is a blank widget nobody can diagnose" - but a
   * builder page has no component. The rationale was never "no stored id",
   * it was "no typing": the editor offers the forms that EXIST, by name, and
   * picking one stores its id. Nothing is ever typed.
   */
  form?: boolean;
  /**
   * WHICH mailing list a sign-up section joins, stored as `signupList`.
   *
   * Same pattern as the giving buttons: a fixed choice, stored by key, never
   * typed. The two keys are the SubscriptionType union the subscribe
   * endpoint already accepts - so when Prayer Team migrates onto the kit,
   * its section stores 'prayer' and behaves identically.
   */
  signupList?: boolean;
  /**
   * The date a COUNTDOWN counts toward, stored as `targetDate`.
   *
   * Stored on the section, not read from an event: the home page's countdown
   * was wired to the summit and could therefore only ever be the summit. A
   * date on the section makes the same band work for a registration
   * deadline, a launch, or next year's conference.
   */
  targetDate?: boolean;
}

/** The lists a sign-up section may join. Keys are the web app's
 *  SubscriptionType union - never renamed once stored. */
export const SIGNUP_LISTS: readonly { key: 'newsletter' | 'prayer'; label: string }[] = [
  { key: 'newsletter', label: 'Monthly newsletter' },
  { key: 'prayer', label: 'Prayer team' }
];

export interface SectionVariant {
  /** Stored in `PageContentBlock.variant`. Never renamed once in use. */
  key: string;
  /** What staff pick from. */
  label: string;
  /** What it draws, in a phrase, for the Add menu. */
  blurb: string;
  fields: KitFields;
  /**
   * Where the media sits, for the archetypes that have any.
   *
   * `auto` alternates by the section's position among its own kind - the
   * rule About Us's story columns and the Library's feature rows already
   * follow. Nothing stores a side: a stored side is a second source of
   * truth that reordering silently breaks.
   */
  mediaSide?: 'auto' | 'left' | 'right';
  /** Surfaces this variant is known to work on. Empty means all of them. */
  surfaces?: readonly SectionSurface[];
}

export interface ArchetypeDef {
  archetype: SECTION_ARCHETYPE;
  label: string;
  blurb: string;
  /** Material icon for the Add menu, matching the existing catalogue. */
  icon: string;
  /** At most one per page. A second hero puts two titles above the fold. */
  singleton?: boolean;
  variants: readonly SectionVariant[];
}

// ---------------------------------------------------------------- the kit

export const SECTION_KIT: readonly ArchetypeDef[] = [
  {
    archetype: SECTION_ARCHETYPE.HERO_BAND,
    label: 'Hero band',
    blurb: 'a photo across the top with the page title over it',
    icon: 'wallpaper',
    singleton: true,
    // ONE LOOK, not two (owner, 2026-08-31). There were two - "title and
    // buttons" with two fixed slots, and "title and a list of buttons" - and
    // the choice bought nothing: a list of buttons does everything two slots
    // do and more. Asking staff to pick between them up front, before they
    // know how many buttons they want, was a decision the screen should have
    // been making for them. Buttons appear when buttons are added.
    // TWO LOOKS, ONE HERO (owner, 2026-08-31). "Hero with a screenshot" used
    // to be its own archetype, and it looked like a near-duplicate of
    // "text beside media" - same grid, same fields. It is not: what makes a
    // hero a hero is that it carries the page's <h1> and there is only one
    // of it. That is true of both looks and of neither body section, so the
    // two heroes belong together and the split-with-a-picture look is a
    // VARIANT rather than an archetype of its own.
    variants: [
      {
        key: 'overPhoto',
        label: 'Title over a photo',
        blurb: 'a small line above, the title, a line of text, and any buttons you add',
        fields: { heading: true, subheading: true, body: true, image: true, entries: true, note: true },
        surfaces: ['photo']
      },
      {
        // The reader app's landing page. No `surfaces` restriction: the
        // picture is beside the words rather than behind them, so this look
        // works on any ground - which is exactly why it could never have
        // been a surface on the one above.
        key: 'besidePicture',
        label: 'Title beside a picture',
        blurb: 'the title and text on one side, a picture on the other, and any buttons you add',
        fields: { heading: true, subheading: true, body: true, note: true, image: true, entries: true },
        mediaSide: 'right'
      }
    ]
  },


  {
    archetype: SECTION_ARCHETYPE.COPY_MEDIA,
    label: 'Text beside media',
    blurb: 'a heading and a passage on one side, a picture or video on the other',
    icon: 'view_sidebar',
    // WHICH SIDE the media sits on is a SETTING on the section now, not a
    // property of the variant (owner, 2026-08-31). The variants below still
    // name a default, and a section that has never been told otherwise keeps
    // it - but "picture on the left" is a choice staff make per section
    // rather than something they have to pick a different look to get.
    variants: [
      {
        key: 'video',
        label: 'Text with a video',
        blurb: 'a click-to-play video beside the text; the photo is the still shown before play',
        fields: { heading: true, subheading: true, body: true, image: true, video: true, entries: true },
        mediaSide: 'right'
      },
      {
        // The buttonList variant that used to sit here is gone: EVERY variant
        // takes a list of buttons now, so it was a second way to say the same
        // thing.
        key: 'image',
        label: 'Text with a picture',
        blurb: 'a picture beside the text',
        fields: { heading: true, body: true, image: true, entries: true },
        mediaSide: 'auto'
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.COPY_CENTRED,
    label: 'Heading and text',
    blurb: 'a passage across the page, centred',
    icon: 'subject',
    variants: [
      {
        // `plain` and `withButtons` were one variant apart: whether there
        // were buttons. Buttons are entries now, so they appear when they are
        // added and there is nothing to choose between (2026-08-31).
        key: 'plain',
        label: 'Heading and text',
        blurb: 'a heading with a passage under it, and any buttons you add',
        fields: { heading: true, subheading: true, body: true, entries: true }
      },
      {
        // Coaching's progress report: the video sits BELOW the text rather
        // than beside it, which is a layout, not a colour - so it is a
        // variant here rather than a surface on COPY_MEDIA.
        key: 'mediaBelow',
        label: 'Heading, text, then a video',
        blurb: 'centred text with a click-to-play video under it and any buttons below that',
        fields: { heading: true, subheading: true, body: true, image: true, video: true, entries: true }
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.PHOTO_BAND,
    label: 'Photo band',
    blurb: 'a full-width photo with words over it',
    icon: 'panorama',
    variants: [
      {
        // Was heading-and-photo only. It takes a passage and buttons now
        // (2026-08-31), which is what let the hardcoded consultation banner
        // become an ordinary section instead of its own archetype.
        key: 'title',
        label: 'Words over a photo',
        blurb: 'a heading, an optional passage and any buttons, over a full-width photo',
        fields: { heading: true, body: true, image: true, entries: true },
        surfaces: ['photo']
      },
      {
        key: 'figure',
        label: 'A big number',
        blurb: 'a large figure with a label, and a paragraph beside it',
        fields: { heading: true, subheading: true, body: true, image: true, entries: true },
        surfaces: ['photo']
      },
      {
        // The Give page's cheque band. The ADDRESS comes from Web Config -
        // it already has one home, and a second copy of a postal address is
        // one that goes stale.
        key: 'address',
        label: 'A band with the postal address',
        blurb: 'a heading, a line, and the ministry address from the site details',
        fields: { heading: true, subheading: true, image: true, entries: true },
        surfaces: ['photo']
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.LIST_ROWS,
    label: 'Labelled rows',
    blurb: 'one row per item: a button, and a line saying what it is',
    icon: 'view_list',
    variants: [
      {
        key: 'buttonAndText',
        label: 'Button and description',
        blurb: 'a heading over one row per item',
        fields: { heading: true, entries: true }
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.LIST_GRID,
    label: 'Tiles',
    blurb: 'repeated tiles in a grid',
    icon: 'grid_view',
    variants: [
      {
        key: 'picture',
        label: 'Picture tiles',
        blurb: 'a picture, a title and a line of text per tile',
        fields: { heading: true, subheading: true, body: true, entries: true }
      },
      {
        // The Seminars picture cards, measured: HORIZONTAL dark rounded
        // rows, a 175px square image on the left, title and copy beside it.
        // A different arrangement, so a variant - no styling turns a
        // vertical tile into this.
        key: 'pictureRows',
        label: 'Picture rows',
        blurb: 'wide cards, each a square picture beside its title and text',
        fields: { heading: true, entries: true }
      },
      {
        key: 'icon',
        label: 'Icon tiles',
        blurb: 'an icon, a title, text and a button per tile',
        fields: { heading: true, entries: true }
      },
      {
        // The AMOUNTS come from Web Config, named by each tile. A tile whose
        // figure cannot be resolved shows no price line rather than "$0".
        key: 'price',
        label: 'Price tiles',
        blurb: 'a title, a price from the site settings, what is included, and a button',
        fields: { heading: true, entries: true }
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.LIST_ARTICLES,
    label: 'Alternating rows',
    blurb: 'a full-width row per item, the picture swapping sides as it goes down',
    icon: 'view_agenda',
    variants: [
      {
        key: 'plain',
        label: 'Alternating rows',
        blurb: 'a cover, a heading, text and a button per row',
        fields: { entries: true },
        mediaSide: 'auto'
      },
      {
        // The Library's feature rows. The jump strip at the top is built from
        // the SAME list, so it cannot fall out of step, and the "01/02" chips
        // are counted from the order rather than stored.
        key: 'numbered',
        label: 'Numbered rows with a jump strip',
        blurb: 'the same, plus a strip of names at the top and a counted chip per row',
        fields: { entries: true },
        mediaSide: 'auto'
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.LIST_COLUMNS,
    label: 'Two columns',
    blurb: 'headed passages in two columns you assign by hand',
    icon: 'view_column',
    singleton: true,
    variants: [
      {
        key: 'twoColumn',
        label: 'Two columns',
        blurb: 'the facts on one side, the pitch on the other',
        fields: { entries: true }
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.TIMELINE,
    label: 'Timeline',
    blurb: 'dated entries down a centre line',
    icon: 'timeline',
    singleton: true,
    variants: [
      {
        key: 'centreLine',
        label: 'Timeline',
        blurb: 'entries alternating either side of a centre line, with year markers',
        fields: { heading: true, subheading: true, entries: true },
        mediaSide: 'auto'
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.CAROUSEL,
    label: 'Quote carousel',
    blurb: 'testimonials on a slider',
    icon: 'format_quote',
    singleton: true,
    variants: [
      {
        // ORDER ONLY. A quote's words, who said it and whether it appears at
        // all belong to the Testimonials screen, because the same quote can
        // be shown on more than one page.
        key: 'quotes',
        label: 'Quote carousel',
        blurb: 'quotes you choose and order, over a background photo',
        fields: { heading: true, subheading: true, image: true, testimonials: true },
        surfaces: ['photo']
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.FORM,
    label: 'Form',
    blurb: 'words around one of the site\'s forms',
    icon: 'assignment',
    variants: [
      {
        key: 'plain',
        label: 'A form under a heading',
        blurb: 'a heading over one of the forms from Form Builder',
        fields: { heading: true, cta: true, form: true }
      },
      {
        key: 'withCopy',
        label: 'A form beside text',
        blurb: 'a heading and a passage beside the form, over a background photo',
        fields: { heading: true, body: true, image: true, cta: true, form: true },
        mediaSide: 'right'
      },
      {
        // Prayer Team's shape. WHICH DETAILS it asks for stays in the site
        // (name and email, a decision about a mailing list rather than page
        // copy) - but WHICH LIST it joins is the section's, picked from the
        // two that exist.
        key: 'mailingList',
        label: 'The sign-up form',
        blurb: 'text above the name-and-email sign-up form',
        fields: { body: true, cta: true, signupList: true }
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.CONTACT_DETAILS,
    label: 'Where to find us',
    blurb: 'the address, email, phone and social links',
    icon: 'contact_page',
    singleton: true,
    variants: [
      {
        // Everything but the heading and the passage comes from Web Config,
        // which already feeds the footer.
        key: 'standard',
        label: 'Where to find us',
        blurb: 'a heading, the contact block, a passage, and the social links',
        fields: { heading: true, body: true }
      }
    ]
  },

  {
    // The home page's slider, as an archetype rather than a special case
    // (2026-08-31, owner's call). It stayed component-owned through the
    // twelve-page cutover because a rotating set of slides is behaviour and
    // not layout - but the BEHAVIOUR is the same wherever it appears, and
    // what changes per site is the slides. So the rotation belongs to the
    // renderer and the slides are entries, like every other list here.
    archetype: SECTION_ARCHETYPE.SLIDER,
    label: 'Slider',
    blurb: 'full-width slides that rotate, each with a picture and a button',
    icon: 'view_carousel',
    singleton: true,
    variants: [
      {
        key: 'slides',
        label: 'Picture slides',
        blurb: 'a picture per slide with a heading, a line of text and a button over it',
        fields: { entries: true }
      }
    ]
  },
  {
    // A countdown to a DATE THE SECTION CARRIES. The home page's summit
    // banner counted down too, but to a date buried in a component - so it
    // could only ever be the summit. Storing the date makes it a countdown
    // to anything: a registration deadline, a launch, the next conference.
    archetype: SECTION_ARCHETYPE.COUNTDOWN,
    label: 'Countdown',
    blurb: 'a clock counting down to a date you set, with a heading and a button',
    icon: 'timer',
    singleton: false,
    variants: [
      {
        key: 'toDate',
        label: 'Countdown to a date',
        blurb: 'days, hours, minutes and seconds until the date, over a picture',
        fields: { heading: true, subheading: true, body: true, image: true, entries: true, targetDate: true }
      }
    ]
  },

  // ---------------------------------------------- the two that replace them
  //
  // Stage 1 (2026-08-31). Beside the fourteen, used by nothing yet.

  {
    archetype: SECTION_ARCHETYPE.SECTION,
    label: 'Section',
    blurb: 'one, two or three columns of whatever you put in them',
    icon: 'view_column',
    // ONE variant, deliberately. How many columns there are is the LENGTH of
    // `columns`, not a look: storing it twice is how the two disagree.
    variants: [
      {
        key: 'columns',
        label: 'Columns',
        blurb: 'add columns, then add pieces to them',
        fields: {}
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.LIST,
    label: 'List',
    blurb: 'one item shape, repeated - tiles, rows, a timeline, a carousel',
    icon: 'view_list',
    // Here the variants ARE the looks, because the same items genuinely draw
    // as different shapes. Each key matches the archetype/variant it absorbs,
    // so the migration is a rename rather than a remap.
    variants: [
      { key: 'tiles', label: 'Picture tiles', blurb: 'a picture, a title and a line of text per tile', fields: { heading: true, subheading: true, body: true, entries: true } },
      { key: 'pictureRows', label: 'Picture rows', blurb: 'wide cards, each a square picture beside its title and text', fields: { heading: true, entries: true } },
      { key: 'icon', label: 'Icon tiles', blurb: 'an icon, a title, text and a button per tile', fields: { heading: true, entries: true } },
      { key: 'price', label: 'Price tiles', blurb: 'a title, a figure from the site settings, what is included, a button', fields: { heading: true, entries: true } },
      { key: 'rows', label: 'Labelled rows', blurb: 'a button on the left, a line of explanation on the right', fields: { heading: true, entries: true } },
      { key: 'articles', label: 'Alternating rows', blurb: 'a full-width row per item, picture sides alternating', fields: { entries: true } },
      { key: 'numbered', label: 'Numbered rows', blurb: 'the same, counted 01/02, with a strip of names above', fields: { entries: true } },
      { key: 'timeline', label: 'Timeline', blurb: 'dated entries down a centre line', fields: { heading: true, subheading: true, entries: true } },
      { key: 'quotes', label: 'Quote carousel', blurb: 'quotes you choose and order, over a background photo', fields: { heading: true, subheading: true, image: true, testimonials: true }, surfaces: ['photo'] },
      { key: 'slides', label: 'Picture slides', blurb: 'full-width slides that rotate, each with a picture and a button', fields: { entries: true }, surfaces: ['photo'] }
    ]
  }
];

// ------------------------------------------------- coverage of today's site

/**
 * EVERY section the site offers today, per page, and what it becomes.
 *
 * This is the whole safety net. It is the migration's input, and it is what
 * the specs assert against - a kit that cannot express one of these rows is a
 * kit that would lose a piece of the site, and a spec goes red rather than
 * anybody finding out in production.
 *
 * ONE ROW PER PAGE, NOT PER RENDERER, which is why there are 49 of these and
 * not the 38 the render census counted. The census counted `@case` blocks,
 * and one component serves all four equipping pages; a migration rewrites
 * documents, so it needs the per-page view. 49 is also exactly the number of
 * kinds the admin catalogue declares, and the admin's own spec pins the two
 * lists to each other.
 *
 * `page` is the page_content document id. `type` is what that page's
 * component switches on TODAY.
 */
export interface LegacyRendering {
  page: string;
  type: PAGE_SECTION_TYPES;
  archetype: SECTION_ARCHETYPE;
  variant: string;
  surface: Exclude<SectionSurface, 'inherit'>;
  /** What is unique about this one and must survive the move. */
  carries?: string;
}

export const LEGACY_RENDERINGS: readonly LegacyRendering[] = [
  // EMPTY since 2026-08-31: all twelve original pages have CUT OVER. Each
  // migration deleted its rows, and toKitBlocks now reports ANY page as
  // unmapped - which is exactly right, because a re-flip of migrated data
  // must refuse loudly. The type and the function stay for the spec that
  // pins that refusal.
];

// ------------------------------------------------------------------ lookups

const BY_ARCHETYPE = new Map<string, ArchetypeDef>(
  SECTION_KIT.map((def): [string, ArchetypeDef] => [def.archetype, def])
);

export function archetypeDef(archetype: string): ArchetypeDef | undefined {
  return BY_ARCHETYPE.get(archetype);
}

/** Returns undefined rather than a guess for an unknown pair, so a stale
 *  stored variant surfaces as a problem instead of rendering as something
 *  plausible. */
export function variantDef(archetype: string, variant: string | undefined): SectionVariant | undefined {
  const def = BY_ARCHETYPE.get(archetype);
  if (!def) {
    return undefined;
  }
  return variant ? def.variants.find((v) => v.key === variant) : def.variants[0];
}

/** Which fields the editor shows, and the renderer may read. */
export function kitFields(archetype: string, variant: string | undefined): KitFields {
  return variantDef(archetype, variant)?.fields ?? {};
}

/** The ground a section is actually drawn on, once the page's theme has had
 *  its say. One place, so the renderer and the admin preview cannot differ. */
export function resolveSurface(
  sectionSurface: SectionSurface | undefined,
  theme: PageTheme = DEFAULT_PAGE_THEME
): Exclude<SectionSurface, 'inherit'> {
  return !sectionSurface || sectionSurface === 'inherit' ? theme.surface : sectionSurface;
}

// -------------------------------------------------- migrating the twelve

/**
 * What flipping one original page onto the kit looks like, without touching
 * anything.
 */
export interface KitMigrationPreview {
  /** The blocks as the kit would store them - type, variant and surface
   *  rewritten from LEGACY_RENDERINGS, everything else untouched. */
  blocks: Record<string, unknown>[];
  /** Sections that could not be mapped, as sentences. A block the map does
   *  not know keeps its old type, WHICH THE KIT CANNOT DRAW - so a preview
   *  must show these rather than quietly rendering a shorter page. */
  problems: string[];
}

/**
 * Behaviour an original page keeps in its COMPONENT that the kit stores on
 * the block instead. Keyed `page/oldType`; applied during the flip.
 *
 * The two form ids are copied from the components that own them today
 * (seminars.component.ts, contact.component.ts) - hand-carried, because the
 * admin cannot read the web app's source, and pinned by the migration spec
 * so a drift is a red build rather than a silently blank form.
 */
const MIGRATION_EXTRAS: Record<string, Record<string, unknown>> = {
  // Emptied with the last cutover - each page's extras (form ids, the
  // prayer list, per-section text styles) were flipped INTO its document
  // and now live there, user-editable.
};

/**
 * ONE original page's blocks, rewritten to the kit's vocabulary.
 *
 * THE PREVIEW AND THE MIGRATION MUST SHARE THIS FUNCTION - it is the whole
 * reason approving a side-by-side comparison means anything. The web app's
 * /kit-preview/<slug> route runs it in memory to draw "what the kit would
 * do"; the eventual migration writes its output to the document. If those
 * two ever computed the flip separately, an approved preview could migrate
 * into something else.
 *
 * PURE, and it copies: the caller's blocks are never mutated, because the
 * preview runs against the LIVE document object other code is rendering.
 */
export function toKitBlocks(
  pageSlug: string,
  blocks: readonly Record<string, unknown>[] | undefined
): KitMigrationPreview {
  const problems: string[] = [];
  const rows = LEGACY_RENDERINGS.filter((r) => r.page === pageSlug);
  // (page, oldType) is unique across all 49 rows - pinned by the spec, and
  // load-bearing here: two rows for one pair would make this flip ambiguous.
  const byType = new Map(rows.map((r) => [r.type as string, r]));

  const mapped = (blocks ?? []).map((block) => {
    const oldType = String(block['type'] ?? '');
    const row = byType.get(oldType);
    if (!row) {
      problems.push(
        `Section "${block['key'] ?? oldType}" (${oldType || 'no type'}) has no `
        + 'mapping for this page - the kit would not draw it.'
      );
      return { ...block };
    }
    return {
      ...block,
      type: row.archetype,
      variant: row.variant,
      surface: row.surface,
      ...(MIGRATION_EXTRAS[`${pageSlug}/${oldType}`] ?? {})
    };
  });

  return { blocks: mapped, problems };
}

// ------------------------------------------------- the home page's own flip

/**
 * What the HOME page's sections become in the kit's vocabulary.
 *
 * The twelve public pages flipped through toKitBlocks() above. Home was left
 * out of that cutover because it is a different collection with a different
 * model - `home_sections`, keyed by `id`, each type naming a component the
 * home page already knew how to draw - and because two of its six sections
 * are behaviour rather than layout.
 *
 * THE SAME CONTRACT AS toKitBlocks: this function IS the migration. The
 * comparison screen renders its output, so what staff approve is what gets
 * written, and there is no second implementation to drift from it.
 *
 * The two behavioural sections are archetypes now rather than special cases
 * (owner's call 2026-08-31): SLIDER rotates, COUNTDOWN counts, and both take
 * their content as ordinary fields and entries.
 */
export interface HomeKitExtras {
  /**
   * The slider's slides, which live in their OWN collection
   * (`home_page_images`) rather than on the section - so they have to be
   * handed in. Migrating turns them into the section's entries; until then
   * this is how the preview shows a real slider rather than an empty band.
   */
  slides?: readonly Record<string, unknown>[];
  /**
   * What the countdown counts to, as an ISO string.
   *
   * Today's banner reads the summit EVENT's start date, which is why it can
   * only ever be the summit. The kit section stores its own date; passing
   * the summit's here is what makes the comparison show the same clock as
   * the live page.
   */
  countdownTo?: string;
}

export function toKitHomeBlocks(
  sections: readonly Record<string, unknown>[] | undefined,
  extras: HomeKitExtras = {}
): KitMigrationPreview {
  const problems: string[] = [];

  const blocks = (sections ?? []).map((section) => {
    const type = String(section['type'] ?? '');
    // Carried on every block: what a visitor sees is still decided by
    // isActive, and the running order is still the array's order.
    const base = {
      key: String(section['id'] ?? type),
      isActive: section['isActive'],
      heading: section['title'],
      body: section['subtitle'],
      image: section['image'],
      ctaTitle: section['ctaTitle'],
      ctaUrl: section['ctaUrl'] ?? section['ctaDestination']
    };

    switch (type) {
      case 'video':
        return { ...base, type: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video',
          surface: 'dark', videoId: section['videoId'] };

      case 'banner':
        return { ...base, type: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'image', surface: 'light' };

      case 'services':
        // pictureRows, TWO PER ROW: the home strip's cards are horizontal -
        // a square picture beside the words - which is the same card the
        // Seminars page uses, and they sit two across rather than four
        // (owner, 2026-08-31, comparing against the live page).
        return { ...base, type: SECTION_ARCHETYPE.LIST_GRID, variant: 'pictureRows',
          surface: 'light', cardsPerRow: 2, items: section['items'] };

      case 'subscribe':
        // 'photo', not a tint: the live block sits on its own background
        // image, and the section already carries that image.
        return { ...base, type: SECTION_ARCHETYPE.FORM, variant: 'mailingList',
          surface: 'photo', signupList: 'newsletter' };

      case 'testimonials':
        return { ...base, type: SECTION_ARCHETYPE.CAROUSEL, variant: 'quotes',
          surface: 'photo', testimonialIds: section['testimonialIds'] };

      case 'slider':
        // The slides are a different collection today - see HomeKitExtras.
        return { ...base, type: SECTION_ARCHETYPE.SLIDER, variant: 'slides',
          surface: 'photo', items: extras.slides ?? [] };

      case 'summitBanner':
        return { ...base, type: SECTION_ARCHETYPE.COUNTDOWN, variant: 'toDate',
          surface: 'photo', targetDate: extras.countdownTo };

      default:
        // Same rule as the twelve: an unmapped section keeps its old type,
        // WHICH THE KIT CANNOT DRAW. Reported rather than silently dropped,
        // so a preview can never look like a shorter page that works.
        problems.push(
          `Section "${section['id'] ?? type}" (${type || 'no type'}) has no mapping - `
          + 'the kit would not draw it.'
        );
        return { ...section, key: String(section['id'] ?? type) };
    }
  });

  return { blocks, problems };
}


// ------------------------------------------------------- the content pieces
//
// WHAT A COLUMN CAN HOLD. Every one of these already existed as a field on
// PageContentBlock or as a rendering in kit-section - this is the same
// content, addressable one piece at a time instead of one archetype at a
// time.
//
// The registry drives the editor's "Add piece" menu and the renderer's piece
// switch from ONE declaration, the same way SECTION_KIT already drives the
// Add-section menu and the archetype switch.

/** Mirrors ContentPieceKind in page-content.model.ts. Declared here as a
 *  string union rather than imported, because the MODEL imports this file -
 *  the dependency runs one way and has to keep doing so. */
export type ContentPieceKindKey =
  | 'heading' | 'eyebrow' | 'text' | 'picture' | 'video' | 'buttons'
  | 'form' | 'signup' | 'countdown' | 'siteDetails' | 'price' | 'note';

export interface ContentPieceDef {
  kind: ContentPieceKindKey;
  label: string;
  blurb: string;
  icon: string;
  /**
   * Which of ContentPiece's fields this kind uses - the same idea as
   * KitFields, one level down. The editor shows a control per true flag.
   */
  fields: {
    text?: boolean;
    level?: boolean;
    html?: boolean;
    image?: boolean;
    video?: boolean;
    buttons?: boolean;
    form?: boolean;
    signupList?: boolean;
    submitLabel?: boolean;
    targetDate?: boolean;
    amount?: boolean;
  };
  /** Said before editing, where a piece will NOT change something staff
   *  might expect it to. Same purpose as an archetype's caveat. */
  caveat?: string;
}

export const CONTENT_PIECES: readonly ContentPieceDef[] = [
  {
    kind: 'heading',
    label: 'Heading',
    blurb: 'a heading, at the level you choose',
    icon: 'title',
    fields: { text: true, level: true }
  },
  {
    kind: 'eyebrow',
    label: 'Small line above',
    blurb: 'the short line that sits over a heading',
    icon: 'short_text',
    fields: { text: true }
  },
  {
    kind: 'text',
    label: 'Text',
    blurb: 'a passage, with the usual formatting',
    icon: 'subject',
    fields: { html: true }
  },
  {
    kind: 'picture',
    label: 'Picture',
    blurb: 'a picture in the column',
    icon: 'image',
    fields: { image: true }
  },
  {
    kind: 'video',
    label: 'Video',
    blurb: 'a click-to-play video; the picture is the still shown before play',
    icon: 'play_circle',
    fields: { video: true, image: true }
  },
  {
    kind: 'buttons',
    label: 'Buttons',
    blurb: 'as many buttons as you add, in the order you put them',
    icon: 'smart_button',
    fields: { buttons: true }
  },
  {
    kind: 'form',
    label: 'Form',
    blurb: 'one of the forms from Form Builder',
    icon: 'assignment',
    fields: { form: true, submitLabel: true },
    caveat: 'WHICH form is chosen from the forms that exist, never typed. An id '
      + 'retyped by hand is a blank widget nobody can diagnose.'
  },
  {
    kind: 'signup',
    label: 'Sign-up form',
    blurb: 'the name-and-email sign-up, joined to one of the mailing lists',
    icon: 'mark_email_read',
    fields: { signupList: true },
    caveat: 'WHICH DETAILS it asks for belongs to the site - it is a decision '
      + 'about a mailing list, not page content. Only the list is set here.'
  },
  {
    kind: 'countdown',
    label: 'Countdown',
    blurb: 'a clock counting to a date you set',
    icon: 'timer',
    fields: { targetDate: true },
    caveat: 'A date that is missing, unreadable or already past draws no clock '
      + 'at all - zeros read as "it starts now" and a negative reads as a bug.'
  },
  {
    kind: 'siteDetails',
    label: 'Contact details',
    blurb: 'the address, phone, email and social links',
    icon: 'contact_page',
    fields: {},
    caveat: 'These come from the site details and already feed the footer. '
      + 'Change them in Web Config, where they have one home.'
  },
  {
    kind: 'price',
    label: 'Price',
    blurb: 'a figure from the site settings',
    icon: 'sell',
    fields: { amount: true },
    caveat: 'The figure is NAMED, never typed. A price with two homes drifts, '
      + 'and a page is not its home - change it in Web Config.'
  },
  {
    kind: 'note',
    label: 'Small line below',
    blurb: 'a quieter line, usually under the buttons',
    icon: 'notes',
    fields: { text: true }
  }
];

export function contentPieceDef(kind: string | undefined): ContentPieceDef | undefined {
  return CONTENT_PIECES.find((piece) => piece.kind === kind);
}

// ------------------------------------------------------------------ presets
//
// WHY PRESETS EXIST. Two catalogue members is the point, but "Section" on its
// own asks staff to build a hero out of parts every time, and the old menu at
// least told them a hero was a thing. A preset is a STARTING POINT, not a
// type: it seeds a Section with its columns, pieces and measured styling in
// place, and the moment it lands it is an ordinary Section like any other.
//
// This is what keeps the consolidation from costing usability. The Add menu
// already renders icon + label + blurb per entry, so presets need no new UI.

export interface SectionPreset {
  key: string;
  label: string;
  blurb: string;
  icon: string;
  /** What gets written. Deliberately plain data rather than a builder
   *  function: a preset can then be read in a review. */
  seed: {
    surface?: SectionSurface;
    headingStyle?: 'bold' | 'light' | 'standard';
    copySize?: 'large' | 'compact' | 'display';
    mediaSide?: 'left' | 'right';
    columns: { pieces: { kind: ContentPieceKindKey; level?: 'page' | 'section' | 'minor' }[] }[];
  };
}

export const SECTION_PRESETS: readonly SectionPreset[] = [
  {
    key: 'hero',
    label: 'Hero',
    blurb: 'the page title over a photo, with buttons',
    icon: 'wallpaper',
    seed: {
      surface: 'photo',
      headingStyle: 'bold',
      columns: [{ pieces: [
        { kind: 'eyebrow' },
        { kind: 'heading', level: 'page' },
        { kind: 'text' },
        { kind: 'buttons' }
      ] }]
    }
  },
  {
    key: 'heroBesidePicture',
    label: 'Hero beside a picture',
    blurb: 'the page title and text on one side, a picture on the other',
    icon: 'vertical_split',
    seed: {
      headingStyle: 'bold',
      mediaSide: 'right',
      columns: [
        { pieces: [
          { kind: 'eyebrow' },
          { kind: 'heading', level: 'page' },
          { kind: 'text' },
          { kind: 'buttons' },
          { kind: 'note' }
        ] },
        { pieces: [{ kind: 'picture' }] }
      ]
    }
  },
  {
    key: 'textWithVideo',
    label: 'Text with a video',
    blurb: 'a heading and a passage on one side, a click-to-play video on the other',
    icon: 'view_sidebar',
    seed: {
      mediaSide: 'right',
      columns: [
        { pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'buttons' }] },
        { pieces: [{ kind: 'video' }] }
      ]
    }
  },
  {
    key: 'textWithPicture',
    label: 'Text with a picture',
    blurb: 'a heading and a passage beside a picture',
    icon: 'photo_library',
    seed: {
      columns: [
        { pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'buttons' }] },
        { pieces: [{ kind: 'picture' }] }
      ]
    }
  },
  {
    key: 'headingAndText',
    label: 'Heading and text',
    blurb: 'a passage across the page, centred',
    icon: 'subject',
    seed: {
      copySize: 'large',
      columns: [{ pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'buttons' }] }]
    }
  },
  {
    key: 'callToAction',
    label: 'Call to action',
    blurb: 'a heading, a line and a button over a photo',
    icon: 'campaign',
    seed: {
      surface: 'photo',
      columns: [{ pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'buttons' }] }]
    }
  },
  {
    key: 'twoColumns',
    label: 'Two columns of text',
    blurb: 'two passages side by side, each with its own heading',
    icon: 'view_column',
    seed: {
      columns: [
        { pieces: [{ kind: 'heading', level: 'minor' }, { kind: 'text' }] },
        { pieces: [{ kind: 'heading', level: 'minor' }, { kind: 'text' }] }
      ]
    }
  },
  {
    key: 'threeColumns',
    label: 'Three columns of text',
    blurb: 'three passages side by side',
    icon: 'view_week',
    seed: {
      columns: [
        { pieces: [{ kind: 'heading', level: 'minor' }, { kind: 'text' }] },
        { pieces: [{ kind: 'heading', level: 'minor' }, { kind: 'text' }] },
        { pieces: [{ kind: 'heading', level: 'minor' }, { kind: 'text' }] }
      ]
    }
  },
  {
    key: 'formBesideText',
    label: 'Form beside text',
    blurb: 'a heading and a passage on one side, a form on the other',
    icon: 'assignment',
    seed: {
      columns: [
        { pieces: [{ kind: 'heading' }, { kind: 'text' }] },
        { pieces: [{ kind: 'form' }] }
      ]
    }
  },
  {
    key: 'signup',
    label: 'Sign-up',
    blurb: 'a heading, a line, and the name-and-email sign-up',
    icon: 'mark_email_read',
    seed: {
      surface: 'tinted',
      columns: [{ pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'signup' }] }]
    }
  },
  {
    key: 'contact',
    label: 'Contact details',
    blurb: 'the address, phone, email and social links',
    icon: 'contact_page',
    seed: {
      columns: [{ pieces: [{ kind: 'heading' }, { kind: 'siteDetails' }, { kind: 'text' }] }]
    }
  },
  {
    key: 'countdown',
    label: 'Countdown',
    blurb: 'a clock counting to a date, over a photo',
    icon: 'timer',
    seed: {
      surface: 'photo',
      columns: [{ pieces: [{ kind: 'heading' }, { kind: 'text' }, { kind: 'countdown' }, { kind: 'buttons' }] }]
    }
  }
];


// ------------------------------------------- fourteen archetypes into two

/**
 * ONE SECTION, redrawn as a Section or a List.
 *
 * THIS FUNCTION IS THE MIGRATION. The comparison screen runs it in memory to
 * show what a page WOULD become, and the cutover script runs the same
 * function to write it - one definition, so an approved preview cannot
 * migrate into something else. It is exactly the contract toKitBlocks had
 * during the first cutover, and it held.
 *
 * PURE, AND IT COPIES. The preview runs against the live document object the
 * editor is rendering; mutating it would change the page under the person
 * looking at it.
 *
 * THE SIX REPEATERS ARE A RENAME. listGrid, listRows, listArticles,
 * timeline, carousel and slider all keep their entries, their heading and
 * their surface exactly as they are - only the type and the variant change,
 * because a List's variants ARE those archetypes' looks. Nothing about the
 * item data moves, which is why there is no entry-reshaping code here.
 *
 * THE EIGHT COMPOSED ONES BECOME COLUMNS. Their fields turn into pieces in
 * the order the old renderer drew them, so a migrated band draws as the band
 * it replaced.
 */
export function toSectionModel(
  block: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  const type = String(block['type'] ?? '');
  const variant = String(block['variant'] ?? '');

  const look = REPEATER_LOOKS[`${type}/${variant}`] ?? REPEATER_LOOKS[type];
  if (look) {
    // A rename, deliberately keeping every other field byte for byte.
    return { ...block, type: SECTION_ARCHETYPE.LIST, variant: look };
  }

  const columns = COLUMN_BUILDERS[type]?.(block);
  if (!columns) {
    // NOT a silent pass-through dressed as a migration. An unmapped section
    // keeps its old type, which the new members cannot draw - reported by
    // toSectionBlocks below so a preview can never look like a shorter page
    // that works.
    return { ...block };
  }

  const migrated: Record<string, unknown> = {
    ...block,
    type: SECTION_ARCHETYPE.SECTION,
    variant: 'columns',
    columns
  };

  // The fields that BECAME pieces are dropped, so nothing is stored twice
  // and there is no second source of truth to drift. Everything else - the
  // surface, the text levers, the photo focus, pairWithNext - stays, because
  // those are still the section's own.
  for (const field of FIELDS_NOW_PIECES) {
    delete migrated[field];
  }
  // The picture stays ONLY where it is the section's background rather than
  // content: on a photo surface the renderer paints block.image itself.
  if (migrated['surface'] !== 'photo') {
    delete migrated['image'];
  }
  return migrated;
}

/** The old archetype/variant pairs that are simply a List with a look. */
const REPEATER_LOOKS: Record<string, string> = {
  [`${SECTION_ARCHETYPE.LIST_GRID}/picture`]: 'tiles',
  [`${SECTION_ARCHETYPE.LIST_GRID}/pictureRows`]: 'pictureRows',
  [`${SECTION_ARCHETYPE.LIST_GRID}/icon`]: 'icon',
  [`${SECTION_ARCHETYPE.LIST_GRID}/price`]: 'price',
  [SECTION_ARCHETYPE.LIST_GRID]: 'tiles',
  [`${SECTION_ARCHETYPE.LIST_ROWS}/buttonAndText`]: 'rows',
  [SECTION_ARCHETYPE.LIST_ROWS]: 'rows',
  [`${SECTION_ARCHETYPE.LIST_ARTICLES}/numbered`]: 'numbered',
  [`${SECTION_ARCHETYPE.LIST_ARTICLES}/plain`]: 'articles',
  [SECTION_ARCHETYPE.LIST_ARTICLES]: 'articles',
  [SECTION_ARCHETYPE.TIMELINE]: 'timeline',
  [SECTION_ARCHETYPE.CAROUSEL]: 'quotes',
  [SECTION_ARCHETYPE.SLIDER]: 'slides'
};

/** Fields whose content has moved into a piece. Deleted after the move so a
 *  value never exists in two places. */
const FIELDS_NOW_PIECES: readonly string[] = [
  'heading', 'subheading', 'body', 'note', 'videoId', 'videoUrl',
  'ctaTitle', 'ctaUrl', 'ctaTitle2', 'ctaUrl2', 'items',
  'formId', 'signupList', 'targetDate',
  'leftGround', 'leftInk', 'leftTitleTone',
  'rightGround', 'rightInk', 'rightTitleTone'
];

type ColumnBuilder = (block: Readonly<Record<string, unknown>>) => Record<string, unknown>[];

/** A piece, or nothing when there is no content for it. Filtered out below,
 *  so an empty field does not become an empty piece staff have to delete. */
function piece(
  kind: ContentPieceKindKey,
  fields: Record<string, unknown>
): Record<string, unknown> | null {
  const meaningful = Object.values(fields).some(
    (value) => value !== undefined && value !== null && value !== ''
      && !(Array.isArray(value) && value.length === 0)
  );
  return meaningful ? { kind, isActive: true, ...fields } : null;
}

/** The buttons a composed section carried, in the order it drew them.
 *  An entries list wins over the legacy cta pair - blocks migrated earlier
 *  this week already carry entries, and the pair was left in place. */
function buttonsOf(block: Readonly<Record<string, unknown>>): Record<string, unknown> | null {
  const items = block['items'] as Record<string, unknown>[] | undefined;
  if (items?.length) {
    return piece('buttons', { buttons: items });
  }
  const legacy: Record<string, unknown>[] = [];
  if (block['ctaTitle']) {
    legacy.push({ title: block['ctaTitle'], link: block['ctaUrl'], isActive: true });
  }
  if (block['ctaTitle2']) {
    legacy.push({ title: block['ctaTitle2'], link: block['ctaUrl2'], isActive: true });
  }
  return legacy.length ? piece('buttons', { buttons: legacy }) : null;
}

/** The words half of a band, in the order every one of them drew it. */
function wordsOf(
  block: Readonly<Record<string, unknown>>,
  level: 'page' | 'section' | 'minor'
): (Record<string, unknown> | null)[] {
  return [
    piece('eyebrow', { text: block['subheading'] }),
    piece('heading', { text: block['heading'], level }),
    piece('text', { html: block['body'] }),
    buttonsOf(block),
    piece('note', { text: block['note'] })
  ];
}

/** A column, keys minted from position so two runs of the migration over the
 *  same document produce identical output. */
function column(
  index: number,
  pieces: (Record<string, unknown> | null)[],
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const live = pieces.filter((p): p is Record<string, unknown> => !!p);
  return {
    key: `col-${index}`,
    ...extra,
    pieces: live.map((p, i) => ({ ...p, key: `${p['kind']}-${index}-${i + 1}` }))
  };
}

/** The media half - a video where there is one, otherwise the picture. */
function mediaOf(block: Readonly<Record<string, unknown>>): Record<string, unknown> | null {
  return block['videoId']
    ? piece('video', { videoId: block['videoId'], image: block['image'] })
    : piece('picture', { image: block['image'], photoFocus: block['photoFocus'] });
}

/** Words first or media first. `mediaSide` is the section's stored opinion;
 *  without one the site's own default put the picture on the right. */
function ordered(
  block: Readonly<Record<string, unknown>>,
  words: Record<string, unknown>,
  media: Record<string, unknown>
): Record<string, unknown>[] {
  return block['mediaSide'] === 'left' ? [media, words] : [words, media];
}

const COLUMN_BUILDERS: Record<string, ColumnBuilder> = {
  // The page title, over a photo or beside a picture. `page` level, because
  // this is the one heading a search engine reads as the page's name - what
  // the hero archetype used to guarantee by being one per page.
  [SECTION_ARCHETYPE.HERO_BAND]: (block) => {
    const beside = String(block['variant'] ?? '') === 'besidePicture';
    // Ranged left, but HELD: the hero copy is 840px on the original, and
    // a single column that spans the row has nothing else to stop it.
    const words = column(1, wordsOf(block, 'page'), beside ? {} : { measure: true });
    if (!beside) {
      return [words];
    }
    const media = column(2, [mediaOf(block)]);
    return ordered(block, words, media);
  },

  // Centred text, held to a readable measure - the two things that made
  // this an archetype of its own. As column properties they are available
  // to any column instead of to one kind of section.
  // mediaBelow puts a video UNDER the copy. Leaving it out of the words
  // dropped the Coaching page's progress-report video altogether - the
  // section still drew, still read correctly, and had simply lost a film.
  [SECTION_ARCHETYPE.COPY_CENTRED]: (block) => {
    const words = wordsOf(block, 'section');
    if (String(block['variant'] ?? '') !== 'mediaBelow') {
      return [column(1, words, { align: 'centre', measure: true })];
    }
    // Between the copy and the buttons, where the archetype draws it.
    const buttonsAt = words.findIndex((p) => p?.['kind'] === 'buttons');
    const at = buttonsAt === -1 ? words.length : buttonsAt;
    const withMedia = [...words];
    withMedia.splice(at, 0, mediaOf(block));
    return [column(1, withMedia, { align: 'centre', measure: true })];
  },

  // THE ONE BAND THAT LEADS WITH ITS HEADING. Every other section puts the
  // small line above the heading; this one puts it underneath. Emitting the
  // usual order swapped the two lines on the Give page, which is exactly
  // what Shane saw and called inverted text.
  //
  // The `figure` variant is a different arrangement again: a display-sized
  // figure on one side and a paragraph on the other, ranged left. That is a
  // variant rather than a surface, and it is two columns.
  [SECTION_ARCHETYPE.PHOTO_BAND]: (block) => {
    const figure = String(block['variant'] ?? '') === 'figure';
    const lead = [
      piece('heading', { text: block['heading'], level: figure ? 'display' : 'section' }),
      piece('eyebrow', { text: block['subheading'] })
    ];
    if (figure) {
      return [column(1, lead), column(2, [piece('text', { html: block['body'] })])];
    }
    return [column(1, [
      ...lead,
      piece('text', { html: block['body'] }),
      buttonsOf(block)
    ], { align: 'centre', measure: true })];
  },

  [SECTION_ARCHETYPE.COPY_MEDIA]: (block) => ordered(
    block,
    column(1, wordsOf(block, 'section')),
    column(2, [mediaOf(block)])
  ),

  // The section heading spans BOTH columns - which is what a full-width
  // column is for. Each passage keeps the ground its side carried.
  [SECTION_ARCHETYPE.LIST_COLUMNS]: (block) => {
    const items = (block['items'] as Record<string, unknown>[] | undefined) ?? [];
    const sideOf = (side: string) => items.filter(
      (item) => (item['column'] ?? 'left') === side
    );
    const passages = (side: string) => sideOf(side).flatMap((item) => [
      piece('heading', { text: item['heading'] ?? item['title'], level: 'minor' }),
      piece('text', { html: item['body'] ?? item['description'] })
    ]);

    const head = column(1, [
      piece('heading', { text: block['heading'], level: 'section' }),
      piece('text', { html: block['body'] })
    ], { full: true });

    const columns: Record<string, unknown>[] = [];
    if ((head['pieces'] as unknown[]).length) {
      columns.push(head);
    }
    columns.push(column(2, passages('left'), {
      ground: block['leftGround'], ink: block['leftInk'], titleTone: block['leftTitleTone']
    }));
    columns.push(column(3, passages('right'), {
      ground: block['rightGround'], ink: block['rightInk'], titleTone: block['rightTitleTone']
    }));
    return columns;
  },

  // Seven of its nine rendered parts come from Web Config, so it is ONE
  // piece rather than a composition - see CONTENT_PIECES.
  // INDENTED as a whole - heading and details together. See
  // SectionColumn.inset for why it is a column lever rather than padding
  // on the details themselves.
  [SECTION_ARCHETYPE.CONTACT_DETAILS]: (block) => [column(1, [
    piece('heading', { text: block['heading'], level: 'section' }),
    piece('text', { html: block['body'] }),
    // It carries nothing of its own: every part of it comes from Web
    // Config, which is the reason it is one piece rather than six.
    { kind: 'siteDetails', isActive: true }
  ], { inset: true })],

  // The Form Builder form and the fixed three-field sign-up are DIFFERENT
  // atoms that happened to share an archetype.
  //
  // TWO COLUMNS on the withCopy variant - words on the left, form on the
  // right. That split IS the variant, and folding it into one column was a
  // real regression: the migrated Seminars page stacked a form under its
  // words where the site puts them side by side. Shane caught it in the
  // comparison.
  [SECTION_ARCHETYPE.FORM]: (block) => {
    const words = wordsOf(block, 'section').filter((p) => p?.['kind'] !== 'buttons');
    const control = String(block['variant'] ?? '') === 'mailingList'
      ? piece('signup', { signupList: block['signupList'] ?? 'newsletter' })
      // ctaTitle on a FORM section is its SUBMIT BUTTON'S label, not a link -
      // the archetype passed it straight to the form renderer. Dropping it
      // turned "GET MY FREE CONSULTATION" into "Submit", which the
      // comparison screen caught within a minute of first running.
      : piece('form', { formId: block['formId'], submitLabel: block['ctaTitle'] });

    if (String(block['variant'] ?? '') !== 'withCopy') {
      // The sign-up band is centred on the site - the form itself already
      // centres, but its heading and words did not follow it across.
      return [column(1, [...words, control], { align: 'centre', measure: true })];
    }
    return [column(1, words), column(2, [control])];
  },

  [SECTION_ARCHETYPE.COUNTDOWN]: (block) => [column(1, [
    piece('eyebrow', { text: block['subheading'] }),
    piece('heading', { text: block['heading'], level: 'section' }),
    piece('countdown', { targetDate: block['targetDate'] }),
    piece('text', { html: block['body'] }),
    buttonsOf(block)
  ])]
};

/** What a whole page becomes, and everything the flip could not express. */
export interface SectionMigrationPreview {
  blocks: Record<string, unknown>[];
  problems: string[];
}

/**
 * A whole page flipped, with anything unmapped REPORTED rather than dropped.
 *
 * Silence is the failure mode that matters here: a section the flip cannot
 * express would simply not draw, and a preview of a shorter page that looks
 * fine is how a migration loses a piece of the site.
 */
export function toSectionBlocks(
  blocks: readonly Record<string, unknown>[] | undefined
): SectionMigrationPreview {
  const problems: string[] = [];
  const mapped = (blocks ?? []).map((block) => {
    const migrated = toSectionModel(block);
    const type = String(migrated['type'] ?? '');
    if (type !== SECTION_ARCHETYPE.SECTION && type !== SECTION_ARCHETYPE.LIST) {
      problems.push(
        `Section "${block['key'] ?? type}" (${type || 'no type'}) has no mapping - `
        + 'it would keep its old shape rather than becoming a Section or a List.'
      );
    }
    return migrated;
  });
  return { blocks: mapped, problems };
}
