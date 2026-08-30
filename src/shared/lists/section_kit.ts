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
  /** Copy on one side and a product shot on the other. The reader app's
   *  landing page, and the only section using the `note` field. */
  HERO_SPLIT = 'heroSplit',
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
  /** A band with nothing editable on it - a section only so that it can be
   *  moved and switched off. */
  FIXED_BAND = 'fixedBand'
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
    variants: [
      {
        key: 'standard',
        label: 'Title and buttons',
        blurb: 'a small line above, the title, a line of copy, and up to two buttons',
        fields: { heading: true, subheading: true, body: true, image: true, cta: true, cta2: true },
        surfaces: ['photo']
      },
      {
        // Prayer Team. Its buttons are ENTRIES rather than two fixed slots so
        // staff can add a third, reorder them, or give one an icon.
        key: 'buttonList',
        label: 'Title and a list of buttons',
        blurb: 'the same band, but any number of buttons, each with an optional icon',
        fields: { heading: true, subheading: true, image: true, entries: true },
        surfaces: ['photo']
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.HERO_SPLIT,
    label: 'Hero with a screenshot',
    blurb: 'copy on one side, a product shot on the other',
    icon: 'vertical_split',
    singleton: true,
    variants: [
      {
        key: 'standard',
        label: 'Copy and a screenshot',
        blurb: 'an eyebrow, the title, a lede, one button, and a small line under it',
        fields: { heading: true, subheading: true, body: true, note: true, image: true, cta: true },
        mediaSide: 'right'
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.COPY_MEDIA,
    label: 'Copy beside media',
    blurb: 'a heading and a passage on one side, a picture or video on the other',
    icon: 'view_sidebar',
    variants: [
      {
        key: 'video',
        label: 'Copy with a video',
        blurb: 'a click-to-play video beside the copy; the photo is the still shown before play',
        fields: { heading: true, subheading: true, body: true, image: true, video: true, cta: true },
        mediaSide: 'right'
      },
      {
        key: 'image',
        label: 'Copy with a picture',
        blurb: 'a picture beside the copy',
        fields: { heading: true, body: true, image: true, cta: true },
        mediaSide: 'auto'
      }
    ]
  },

  {
    archetype: SECTION_ARCHETYPE.COPY_CENTRED,
    label: 'Heading and copy',
    blurb: 'a passage across the page, centred',
    icon: 'subject',
    variants: [
      {
        key: 'plain',
        label: 'Heading and copy',
        blurb: 'a heading with a passage under it',
        fields: { heading: true, body: true }
      },
      {
        key: 'withButtons',
        label: 'Heading, copy and buttons',
        blurb: 'the same, with up to two buttons under it',
        fields: { heading: true, subheading: true, body: true, cta: true, cta2: true }
      },
      {
        // Coaching's progress report: the video sits BELOW the copy rather
        // than beside it, which is a layout, not a colour - so it is a
        // variant here rather than a surface on COPY_MEDIA.
        key: 'mediaBelow',
        label: 'Heading, copy, then a video',
        blurb: 'centred copy with a click-to-play video under it and a button below that',
        fields: { heading: true, subheading: true, body: true, image: true, video: true, cta: true }
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
        key: 'title',
        label: 'A line across a photo',
        blurb: 'one heading over a full-width photo',
        fields: { heading: true, image: true },
        surfaces: ['photo']
      },
      {
        key: 'figure',
        label: 'A big number',
        blurb: 'a large figure with a label, and a paragraph beside it',
        fields: { heading: true, subheading: true, body: true, image: true },
        surfaces: ['photo']
      },
      {
        // The Give page's cheque band. The ADDRESS comes from Web Config -
        // it already has one home, and a second copy of a postal address is
        // one that goes stale.
        key: 'address',
        label: 'A band with the postal address',
        blurb: 'a heading, a line, and the ministry address from the site details',
        fields: { heading: true, subheading: true, image: true },
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
        blurb: 'a picture, a title and a line of copy per tile',
        fields: { heading: true, subheading: true, body: true, entries: true }
      },
      {
        key: 'icon',
        label: 'Icon tiles',
        blurb: 'an icon, a title, copy and a button per tile',
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
        blurb: 'a cover, a heading, copy and a button per row',
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
        label: 'A form beside copy',
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
        blurb: 'copy above the name-and-email sign-up form',
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
    archetype: SECTION_ARCHETYPE.FIXED_BAND,
    label: 'Consultation banner',
    blurb: 'the shared "receive a free consultation" band',
    icon: 'campaign',
    singleton: true,
    variants: [
      {
        key: 'consultation',
        label: 'Consultation banner',
        blurb: 'nothing on it is edited - it is a section so it can be moved or switched off',
        fields: {}
      }
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
  // ---- heroes. Five of these six are already one shared component.
  { page: 'equipping-groups', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'equipping-groups-pastors', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'equipping-groups-leaders', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'equipping-groups-churches', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'seminars', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'lunch-and-learns', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'give', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  { page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.PAGE_HEADER, archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'standard', surface: 'photo' },
  {
    page: 'prayer-team', type: PAGE_SECTION_TYPES.PAGE_HEADER,
    archetype: SECTION_ARCHETYPE.HERO_BAND, variant: 'buttonList', surface: 'photo',
    carries: 'buttons come from entries, each with an optional icon'
  },
  {
    page: 'discipleship-library', type: PAGE_SECTION_TYPES.PAGE_HEADER,
    archetype: SECTION_ARCHETYPE.HERO_SPLIT, variant: 'standard', surface: 'dark',
    carries: 'the only use of `note`; the button opens the reader app, whose URL stays in the site'
  },

  // ---- copy beside media
  {
    page: 'about-us', type: PAGE_SECTION_TYPES.MISSION,
    archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'dark',
    carries: 'asks YouTube for highres'
  },
  { page: 'equipping-groups', type: PAGE_SECTION_TYPES.MISSION, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light' },
  { page: 'equipping-groups-pastors', type: PAGE_SECTION_TYPES.MISSION, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light' },
  { page: 'equipping-groups-leaders', type: PAGE_SECTION_TYPES.MISSION, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light' },
  { page: 'equipping-groups-churches', type: PAGE_SECTION_TYPES.MISSION, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light' },
  { page: 'seminars', type: PAGE_SECTION_TYPES.MISSION, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light' },
  {
    page: 'lunch-and-learns', type: PAGE_SECTION_TYPES.MISSION,
    archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'video', surface: 'light',
    carries: 'a divider above the section, so dragging it takes the rule along'
  },
  {
    page: 'about-us', type: PAGE_SECTION_TYPES.STORY,
    archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'image', surface: 'light',
    carries: 'three of them; the picture side alternates by position'
  },
  { page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.STORY, archetype: SECTION_ARCHETYPE.COPY_MEDIA, variant: 'image', surface: 'light' },

  // ---- centred copy. The differences here are almost entirely colour.
  { page: 'seminars', type: PAGE_SECTION_TYPES.PROSE, archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'plain', surface: 'light' },
  { page: 'lunch-and-learns', type: PAGE_SECTION_TYPES.PROSE, archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'plain', surface: 'light' },
  { page: 'give', type: PAGE_SECTION_TYPES.PROSE, archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'plain', surface: 'light' },
  { page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.PROSE, archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'withButtons', surface: 'light' },
  {
    page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.MISSION,
    archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'mediaBelow', surface: 'light',
    carries: 'passes disablePlaceholder, or YouTube draws a second play button'
  },
  {
    page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.BANNER,
    archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'withButtons', surface: 'tinted'
  },
  {
    page: 'discipleship-library', type: PAGE_SECTION_TYPES.PROSE,
    archetype: SECTION_ARCHETYPE.COPY_CENTRED, variant: 'withButtons', surface: 'tinted',
    carries: 'the button opens the reader app, whose URL stays in the site'
  },

  // ---- photo bands
  {
    page: 'about-us', type: PAGE_SECTION_TYPES.BANNER,
    archetype: SECTION_ARCHETYPE.PHOTO_BAND, variant: 'title', surface: 'photo',
    carries: 'the #history anchor the story buttons point at'
  },
  { page: 'about-us', type: PAGE_SECTION_TYPES.COUNTRIES, archetype: SECTION_ARCHETYPE.PHOTO_BAND, variant: 'figure', surface: 'photo' },
  {
    page: 'give', type: PAGE_SECTION_TYPES.ADDRESS_BAND,
    archetype: SECTION_ARCHETYPE.PHOTO_BAND, variant: 'address', surface: 'photo',
    carries: 'the postal address comes from Web Config'
  },

  // ---- lists
  { page: 'equipping-groups', type: PAGE_SECTION_TYPES.CARDS, archetype: SECTION_ARCHETYPE.LIST_ROWS, variant: 'buttonAndText', surface: 'light' },
  {
    page: 'seminars', type: PAGE_SECTION_TYPES.CARDS,
    archetype: SECTION_ARCHETYPE.LIST_GRID, variant: 'picture', surface: 'light',
    carries: 'a divider above the section'
  },
  { page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.GALLERY, archetype: SECTION_ARCHETYPE.LIST_GRID, variant: 'picture', surface: 'light' },
  {
    page: 'give', type: PAGE_SECTION_TYPES.GIVE_OPTIONS,
    archetype: SECTION_ARCHETYPE.LIST_GRID, variant: 'icon', surface: 'light',
    carries: 'each button opens one of three hosted payment pages, chosen by KEY and never typed'
  },
  {
    page: 'seminars', type: PAGE_SECTION_TYPES.PRICES,
    archetype: SECTION_ARCHETYPE.LIST_GRID, variant: 'price', surface: 'light',
    carries: 'amounts resolve from Web Config; an unresolvable figure shows no price rather than $0'
  },
  { page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.CARDS, archetype: SECTION_ARCHETYPE.LIST_ARTICLES, variant: 'plain', surface: 'light' },
  {
    page: 'discipleship-library', type: PAGE_SECTION_TYPES.FEATURES,
    archetype: SECTION_ARCHETYPE.LIST_ARTICLES, variant: 'numbered', surface: 'light',
    carries: 'the #what-it-does anchor; the jump strip; .mp4 entries play muted inline via [muted] as a PROPERTY'
  },
  {
    page: 'equipping-groups-pastors', type: PAGE_SECTION_TYPES.COLUMNS,
    archetype: SECTION_ARCHETYPE.LIST_COLUMNS, variant: 'twoColumn', surface: 'light',
    carries: 'a passage may be a heading, a Web Config price line, a button, or all three'
  },
  { page: 'equipping-groups-leaders', type: PAGE_SECTION_TYPES.COLUMNS, archetype: SECTION_ARCHETYPE.LIST_COLUMNS, variant: 'twoColumn', surface: 'light' },
  { page: 'equipping-groups-churches', type: PAGE_SECTION_TYPES.COLUMNS, archetype: SECTION_ARCHETYPE.LIST_COLUMNS, variant: 'twoColumn', surface: 'light' },
  { page: 'about-us', type: PAGE_SECTION_TYPES.TIMELINE, archetype: SECTION_ARCHETYPE.TIMELINE, variant: 'centreLine', surface: 'light' },

  // ---- the rest
  {
    page: 'coaching-with-impact', type: PAGE_SECTION_TYPES.TESTIMONIALS,
    archetype: SECTION_ARCHETYPE.CAROUSEL, variant: 'quotes', surface: 'photo',
    carries: 'reads the shared testimonials collection; the section stores only the order'
  },
  {
    page: 'contact', type: PAGE_SECTION_TYPES.FORM,
    archetype: SECTION_ARCHETYPE.FORM, variant: 'plain', surface: 'light',
    carries: 'the form id stays in the site; this page has NO stylesheet of its own'
  },
  {
    page: 'seminars', type: PAGE_SECTION_TYPES.FORM,
    archetype: SECTION_ARCHETYPE.FORM, variant: 'withCopy', surface: 'photo',
    carries: 'the form id stays in the site'
  },
  {
    page: 'prayer-team', type: PAGE_SECTION_TYPES.SIGNUP,
    archetype: SECTION_ARCHETYPE.FORM, variant: 'mailingList', surface: 'light',
    carries: 'the three fields it asks for stay in the site'
  },
  {
    page: 'contact', type: PAGE_SECTION_TYPES.CONTACT_INFO,
    archetype: SECTION_ARCHETYPE.CONTACT_DETAILS, variant: 'standard', surface: 'light',
    carries: 'address, email, phone and five social links from Web Config'
  },
  { page: 'equipping-groups', type: PAGE_SECTION_TYPES.CONSULT_BANNER, archetype: SECTION_ARCHETYPE.FIXED_BAND, variant: 'consultation', surface: 'tinted' },
  { page: 'equipping-groups-pastors', type: PAGE_SECTION_TYPES.CONSULT_BANNER, archetype: SECTION_ARCHETYPE.FIXED_BAND, variant: 'consultation', surface: 'tinted' },
  { page: 'equipping-groups-leaders', type: PAGE_SECTION_TYPES.CONSULT_BANNER, archetype: SECTION_ARCHETYPE.FIXED_BAND, variant: 'consultation', surface: 'tinted' },
  { page: 'equipping-groups-churches', type: PAGE_SECTION_TYPES.CONSULT_BANNER, archetype: SECTION_ARCHETYPE.FIXED_BAND, variant: 'consultation', surface: 'tinted' }
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
  'seminars/form': { formId: 'KsdeDkokfLGRI3sPFijp' },
  'contact/form': { formId: 'N0ynW6zeYKdXQS2EkBii' },
  'prayer-team/signup': { signupList: 'prayer' },

  // TEXT STYLE the flip carries where a page's original section measured
  // differently from the kit defaults (bold / compact). These are the same
  // knobs the editor exposes, so after migrating the USER owns them - the
  // flip only sets the starting point to what the page already looked like.
  // Grown page by page as each comparison is approved; Lunch and Learns
  // first: its OVERVIEW measures 50px/weight-500 over 20px/40 copy running
  // the container's width.
  'lunch-and-learns/prose': { headingStyle: 'light', copySize: 'large' }
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
