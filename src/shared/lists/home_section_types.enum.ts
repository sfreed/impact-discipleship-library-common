// The VALUES are what sit in Firestore's `home_sections.type`, so they are
// the stable part - rename a member freely, never a value.
//
// Each type names a component the public home page already knows how to
// render. Adding a member here is half of adding a section: the web app's
// section dispatcher has to learn it too, or the section is skipped.
export enum HOME_SECTION_TYPES {
    /** The hero carousel. Its SLIDES live in `home_page_images`. */
    SLIDER = 'slider',
    /** The strip of service cards - the only type that uses `items`. */
    SERVICES = 'services',
    /** Disciple-Making Summit banner with the live countdown. */
    SUMMIT_BANNER = 'summitBanner',
    /** A heading, a blurb and a click-to-play YouTube video. */
    VIDEO = 'video',
    /** Picture on one side, copy and a button on the other. */
    BANNER = 'banner',
    /** The mailing-list signup block. */
    SUBSCRIBE = 'subscribe',
    /**
     * Quotes from the shared `testimonials` collection.
     *
     * Nothing on the home page renders this yet - it is here so the section
     * can be added from the admin later without a submodule change and a
     * pointer bump in three repos. `TESTIMONIAL_TYPES.HOME` already exists
     * and is the pool it draws from.
     */
    TESTIMONIALS = 'testimonials'
}
