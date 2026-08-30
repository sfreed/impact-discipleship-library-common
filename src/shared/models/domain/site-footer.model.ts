import { SiteNavItem, validateSiteNavigation } from './site-navigation.model';

/**
 * THE PUBLIC SITE'S FOOTER (2026-08-30).
 *
 * The footer renders on every page of the site, and until now every word of
 * it was hardcoded in footer.component.html - fourteen links, four headings
 * and three lines of copyright that took a deploy to change.
 *
 * WHAT IS DELIBERATELY NOT HERE: the address, phone, email and social links.
 * Those already live on `web_config`, which is already editable under Page
 * Manager > Web Config. The footer was reading a SECOND, hardcoded copy of
 * them (shared/utils/data/impact-disciples.data.ts) that nobody could edit -
 * so the fix there is to point the footer at the config it should always
 * have read, not to make a third copy here. The Footer screen shows them
 * read-only and links across.
 *
 * NOTHING STORES A POSITION. Order is array order, columns and links alike -
 * the same rule as PageContentBlock and SiteNavItem.
 */

/** A column of links. Three today: Information, Training, Free Resources. */
export interface SiteFooterColumn {
  /** Stable across reorders and renames. */
  id: string;
  /** The column's own heading. Rendered as written - the site's stylesheet
   *  is what uppercases "newsletter", not the stored value. */
  heading: string;
  /**
   * The links under it.
   *
   * SiteNavItem, the same type the top menu uses, on purpose: a footer link
   * and a menu link are the same thing pointing at the same catalogue, so
   * they get the same route resolution, the same external/highlight flags,
   * the same validator and the same editor. `kind: 'group'` is refused here
   * - a footer column does not nest.
   */
  links: SiteNavItem[];
  /** Switched off without being deleted - a seasonal column can come back. */
  visible: boolean;
}

export interface SiteFooter {
  id?: string;

  /** The masthead line, top left, which links to the home page. */
  brandTitle: string;

  /** The small links directly under the masthead - "Give | Join the Prayer
   *  Team" today. Same SiteNavItem shape as everything else. */
  brandLinks: SiteNavItem[];

  /** The line under those. Free text, because it is a rights statement
   *  rather than a link and its wording is somebody's decision - it has read
   *  "@2024 Ken Adams All Right reserved." since 2024. */
  attribution: string;

  /** The link columns, in the order they appear across the footer. */
  columns: SiteFooterColumn[];

  /** The subscribe box. The FORM itself is behaviour and stays in the web
   *  app; only its words are here. */
  newsletterHeading: string;
  newsletterBlurb: string;

  /** The bar along the very bottom. `bottomLinkLabel`/`bottomLinkUrl` are
   *  the "contact" link inside it - a mailto today, which is why it is a
   *  free-text address rather than a catalogue route. */
  bottomText: string;
  bottomLinkLabel?: string;
  bottomLinkUrl?: string;

  /** The image behind the top half. A full URL - these are Firebase Storage
   *  download links with tokens in them, not paths. */
  backgroundImage?: string;
}

export const SITE_FOOTER_COLLECTION = 'site_footer';
export const SITE_FOOTER_DOC_ID = 'main';

/**
 * Everything wrong with a footer, in plain sentences.
 *
 * Leans on the navigation validator for the links themselves rather than
 * repeating those rules - a link with no address is the same mistake in
 * either place, and two validators that drift is how a screen ends up
 * refusing to save what a seed just wrote.
 */
export function validateSiteFooter(footer: SiteFooter): string[] {
  const problems: string[] = [];

  if (!footer.brandTitle?.trim()) {
    problems.push('The footer has no title.');
  }

  const seen = new Set<string>();
  for (const column of footer.columns ?? []) {
    if (!column.heading?.trim()) {
      problems.push('A column has no heading.');
    }
    if (!column.id?.trim()) {
      problems.push(`Column "${column.heading}" has no id.`);
    } else if (seen.has(column.id)) {
      problems.push(`Column "${column.heading}" repeats an id already used.`);
    } else {
      seen.add(column.id);
    }
    if (!column.links?.length) {
      problems.push(`Column "${column.heading}" has no links in it.`);
    }
    for (const link of column.links ?? []) {
      if (link.kind === 'group') {
        problems.push(`"${link.title}" is a dropdown, and a footer column cannot hold one.`);
      }
    }
  }

  // The links, by the navigation rules. Prefixed so a problem in the footer
  // does not read as one in the menu.
  const everyLink = [...(footer.brandLinks ?? []), ...(footer.columns ?? []).flatMap((c) => c.links ?? [])];
  for (const problem of validateSiteNavigation(everyLink)) {
    problems.push(problem);
  }

  return problems;
}

/** Columns a VISITOR would see - switched-off columns, and any left with no
 *  visible links, drop out. Applied by the site, never by the editor. */
export function liveFooterColumns(columns: SiteFooterColumn[]): SiteFooterColumn[] {
  return (columns ?? [])
    .filter((column) => column.visible)
    .map((column) => ({ ...column, links: (column.links ?? []).filter((link) => link.visible) }))
    .filter((column) => column.links.length > 0);
}
