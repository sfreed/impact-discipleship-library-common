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
 * THE TWO MEMBERS. These are RENDERERS, and the values are what sits in
 * `page_content.blocks[].type` - so a member may be renamed freely and a
 * VALUE never may.
 *
 * FOURTEEN ARCHETYPES WERE DELETED FROM HERE on 2026-09-01. They came from
 * a census of the twelve original pages and were the step between nine
 * bespoke page components and these two: heroBand, copyMedia, copyCentred,
 * photoBand, listRows, listGrid, listArticles, listColumns, timeline,
 * carousel, form, contactDetails, slider, countdown.
 *
 * Every one of them turned out to be one of these two wearing a fixed
 * arrangement. Eight were compositions - a heading, some text, a picture,
 * some buttons - which is a SECTION whose columns were decided in advance.
 * Six were one shape repeated, which is a LIST with the look chosen for it.
 */
export enum SECTION_ARCHETYPE {
  /** ONE TO THREE COLUMNS, each an ordered list of content pieces. */
  SECTION = 'section',
  /**
   * ONE ITEM SHAPE REPEATED, with a look.
   *
   * A repeater is not a column: twelve tiles are not twelve columns, and
   * three of the looks carry per-item state a column model has nowhere to
   * put - alternation by position, counted chips, rotation.
   */
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
  // `mediaSide` was declared here and is gone (2026-09-01). A variant could
  // fix which side a composed archetype's picture sat on; neither of the two
  // members has a picture half to place. A Section says it by which column
  // holds the picture, and a List has no such half at all.
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
      { key: 'quoteCards', label: 'Quote cards', blurb: 'a square photo beside a quote, with who said it underneath - the same card as Picture rows with its two boxes swapped. The words are TYPED HERE, unlike the quote carousel, whose words belong to the Testimonials screen', fields: { heading: true, subheading: true, entries: true } },
      { key: 'icon', label: 'Icon tiles', blurb: 'an icon, a title, text and a button per tile', fields: { heading: true, entries: true } },
      { key: 'price', label: 'Price tiles', blurb: 'a title, a figure from the site settings, what is included, a button', fields: { heading: true, entries: true } },
      { key: 'rows', label: 'Labelled rows', blurb: 'a button on the left, a line of explanation on the right', fields: { heading: true, entries: true } },
      { key: 'articles', label: 'Alternating rows', blurb: 'a full-width row per item, picture sides alternating', fields: { entries: true } },
      { key: 'numbered', label: 'Numbered rows', blurb: 'the same, counted 01/02, with a strip of names above', fields: { entries: true } },
      { key: 'timeline', label: 'Timeline', blurb: 'dated entries down a centre line', fields: { heading: true, subheading: true, entries: true } },
      { key: 'quotes', label: 'Quote carousel', blurb: 'quotes you choose and order, over a background photo - only the ORDER is set here, because the same quote can appear on more than one page and its words belong to the Testimonials screen', fields: { heading: true, subheading: true, image: true, testimonials: true }, surfaces: ['photo'] },
      { key: 'slides', label: 'Picture slides', blurb: 'full-width slides that rotate, each with a picture and a button', fields: { entries: true }, surfaces: ['photo'] }
    ]
  }
];


/**
 * The List looks drawn as a GRID of cards, and so the only ones a cards-per-row
 * setting means anything to.
 *
 * It exists because the setting has to be OFFERED in the admin and OBEYED in
 * the web app, and those are different codebases. Showing the control on a
 * timeline or a carousel would be a control that silently does nothing - the
 * exact complaint that retired the old copy-colour toggle, which changed
 * nothing on half the sections it appeared on.
 *
 * The web renderer keeps its own look -> layout map (LIST_LOOKS); its spec
 * asserts the two agree, so neither can drift without going red.
 */
export const GRID_LIST_LOOKS: readonly string[] = [
  'tiles', 'pictureRows', 'quoteCards', 'icon', 'price'
];

// ------------------------------------------------------------------ lookups

// BY_ARCHETYPE was the index behind archetypeDef()/variantDef()/kitFields(),
// all of which went with the fourteen archetypes on 2026-09-01. Nothing has
// looked anything up by archetype since - there are two members and the
// renderer switches on them directly.

/** The ground a section is actually drawn on, once the page's theme has had
 *  its say. One place, so the renderer and the admin preview cannot differ. */
export function resolveSurface(
  sectionSurface: SectionSurface | undefined,
  theme: PageTheme = DEFAULT_PAGE_THEME
): Exclude<SectionSurface, 'inherit'> {
  return !sectionSurface || sectionSurface === 'inherit' ? theme.surface : sectionSurface;
}


// MIGRATION_EXTRAS held the behaviour an original page kept in its COMPONENT
// that the kit had to store on the block instead - form ids, the prayer
// list, per-section text styles - keyed `page/oldType` and applied during
// the flip. It was emptied when the last page cut over on 2026-08-31, and
// the transform that read it went with the archetypes the day after. An
// empty map nothing reads is not a record of anything.


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
    /** heading - offer "read but not seen". See ContentPiece.hidden. */
    hidden?: boolean;
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
    fields: { text: true, level: true, hidden: true }
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
// TWELVE PRESETS LIVED HERE UNTIL 2026-08-31 - Hero, Text with a video,
// Call to action - each a ready-made arrangement that placed a Section
// already carrying its columns, pieces and measured styling.
//
// They existed to answer one objection to a freeform builder: that it makes
// every arrangement equally easy, including building a hero from scratch
// every time. THE PIECE PALETTE ANSWERED IT BETTER. Dragging a heading,
// some text and two buttons into a column is quick enough that a shortcut
// for it is a concept nobody needs to learn - and twelve of them on the Add
// bar made two members look like twelve types, which is the exact
// impression this consolidation exists to remove. Shane asked why he was
// seeing twelve, which is how a design tells you it is wrong.
//
// The reason is worth keeping: the fix for "the freeform thing is tedious"
// was to make the freeform thing quick, not to hide it behind presets.


// ------------------------------------------- fourteen archetypes into two
//
// THE MIGRATION LIVED HERE and was deleted on 2026-09-01, once every page
// stored a Section or a List and nothing stored an archetype.
//
// toSectionModel() was the whole contract of that move: the comparison
// screen ran it in memory to show what a page WOULD become, and the
// cutover script ran the same function to write it, so an approved preview
// could not migrate into something else. It held twice - nine bespoke page
// components into fourteen archetypes, then fourteen into two.
//
// It is gone rather than kept for a rainy day because there is nothing left
// to migrate FROM: the fourteen are deleted in this same pass, so the
// function could not be given an input. Its specs went with it - a spec for
// a function nothing can call cannot fail for a reason that matters.
//
// What it KNEW that outlived it is in the data now: a photo band leading
// with its heading, a form section carrying its submit label, a two-column
// band spanning its heading. And in git, which is where a one-way
// transform belongs.
