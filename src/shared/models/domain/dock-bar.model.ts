import { BaseModel } from '../base.model';

/** One button on the docking bar. `destination` is either a site path
 *  ('/impact-groups') chosen from the admin's destination dropdown, or the
 *  literal sentinel 'external', in which case `url` carries the real
 *  address - the same two-field convention HomePageImageModel's
 *  ctaDestination/ctaUrl pair already uses, so the slide editor and the
 *  docking bar editor behave identically. */
export interface DockBarCta {
  title: string;
  destination: string;
  /** Set only when destination === 'external'. */
  url?: string;
}

/**
 * Content for the public site's docking bar - the strip fixed to the bottom
 * of every page (see the web app's LibraryDockComponent).
 *
 * A SINGLETON: one document, id `current`, in the `dock_bar` collection.
 * There is one bar on the site, so this is a settings record rather than a
 * list - same shape of thing as WebConfigModel, not HomePageImageModel.
 *
 * PUBLIC-READABLE under firestore.rules, for the same reason campaign_popups
 * is: the public site has no Firebase Auth at all, so anything it renders has
 * to be world-readable. Nothing sensitive belongs on this model.
 */
export class DockBarModel extends BaseModel {
  /** Master switch. False (or a missing document) means no bar on any page. */
  isActive = false;
  /** Small accent label above the message, e.g. 'NEW'. Optional - omit it
   *  and the bar renders the message alone. */
  label?: string;
  /** The announcement itself, rendered as the bar's bold line. */
  message: string;
  /** Dimmer trailing note on the same line, e.g. '· free to join'. */
  note?: string;
  /** At least one button is required for the bar to be worth showing. */
  cta1: DockBarCta;
  /** Optional second button. */
  cta2?: DockBarCta;
}
