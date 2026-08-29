// The VALUES are what sit in Firestore's `page_content.blocks[].type`, so
// they are the stable part - rename a member freely, never a value.
//
// These name SECTION SHAPES, not pages. A `story` is a column of copy
// beside a picture wherever it appears; About Us happens to use three of
// them. A page whose template is a dispatcher loops over its blocks and
// hands each one to the renderer its type names.
//
// A SHAPE MAY LOOK DIFFERENT PER PAGE, and that is the point. Every page
// has its OWN section component drawing these types in that page's idiom -
// `mission` is a dark band on About Us and a light two-up on the equipping
// pages - so a shared vocabulary never forces a shared look. What a type
// fixes is which FIELDS a section has and what they mean.
//
// Adding a member here is half of adding a section: the page's dispatcher
// component has to learn it too, or the section is skipped. Which pages
// offer which types is declared in the admin's page-section-catalogue.ts.
export enum PAGE_SECTION_TYPES {
    // -------------------------------------------------- across many pages
    /** The hero at the top: background photo, small pretitle, big title,
     *  a line of copy, and up to two buttons. */
    PAGE_HEADER = 'pageHeader',
    /** A heading and a passage of copy, full width, optionally a button. */
    PROSE = 'prose',
    /** Copy on one side, a click-to-play video on the other. */
    MISSION = 'mission',
    /** A heading over repeated cards - a picture, a title, a line of copy
     *  and somewhere to go. */
    CARDS = 'cards',
    /** Headed passages laid out in TWO columns. Which column an entry sits
     *  in is stored on the entry, because the columns say different kinds
     *  of thing (the facts on the left, the pitch on the right) rather
     *  than alternating. */
    COLUMNS = 'columns',
    /** Price tiles. The AMOUNTS come from Web Config and are not editable
     *  here - only their labels, bullets and buttons. */
    PRICES = 'prices',
    /** A heading, a passage, and one of the forms built in Form Builder.
     *  WHICH form stays in the page: a Firestore id is not something to
     *  retype into a text box. */
    FORM = 'form',
    /** The shared "receive a free consultation" band. Nothing to edit; it
     *  is here so it can be moved and switched off. */
    CONSULT_BANNER = 'consultBanner',

    // ------------------------------------------------------- About Us
    /** Copy and a button beside a picture. Repeatable. */
    STORY = 'story',
    /** A full-width band: a background photo with a heading over it. */
    BANNER = 'banner',
    /** Dated entries down a centre line, alternating left and right. */
    TIMELINE = 'timeline',
    /** A big figure with a label, and a paragraph beside it. */
    COUNTRIES = 'countries',

    // ------------------------------------------------ one page each
    /** Give: the giving options. Each one's DESTINATION is chosen from a
     *  fixed list of the ministry's payment pages, never typed - see the
     *  catalogue's note. */
    GIVE_OPTIONS = 'giveOptions',
    /** Give: the "mail a cheque to" band. The address comes from the site
     *  details, not from here. */
    ADDRESS_BAND = 'addressBand',
    /** Contact: the heading, the address block, the copy and the socials.
     *  Only the heading and the copy are edited here. */
    CONTACT_INFO = 'contactInfo',
    /** Discipleship Library: the jump strip and the alternating feature
     *  rows, from one list of entries. */
    FEATURES = 'features',
    /** Prayer Team: the copy above the join form. The form itself stays in
     *  the page. */
    SIGNUP = 'signup'
}
