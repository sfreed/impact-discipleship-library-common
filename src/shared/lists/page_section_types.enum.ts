// The VALUES are what sit in Firestore's `page_content.blocks[].type`, so
// they are the stable part - rename a member freely, never a value.
//
// These name SECTION SHAPES, not pages. A `story` is a column of copy
// beside a picture wherever it appears; About Us happens to use three of
// them. A page whose template is a dispatcher loops over its blocks and
// hands each one to the renderer its type names.
//
// Adding a member here is half of adding a section: the page's dispatcher
// component has to learn it too, or the section is skipped.
export enum PAGE_SECTION_TYPES {
    /** Copy and a button beside a picture. Repeatable. */
    STORY = 'story',
    /** A full-width band: a background photo with a heading over it. */
    BANNER = 'banner',
    /** Copy on one side, a click-to-play video on the other. */
    MISSION = 'mission',
    /** Dated entries down a centre line, alternating left and right. */
    TIMELINE = 'timeline',
    /** A big figure with a label, and a paragraph beside it. */
    COUNTRIES = 'countries'
}
