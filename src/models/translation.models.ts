// Shared translation-related shapes. Reconciled during extraction: the reader
// app's previous copies of these were a strict subset missing the audit
// fields (createdAt/updatedAt/createdBy/updatedBy) since it never writes
// translations - this canonical version keeps them (the data always has them,
// written by the manager app), the reader app simply never populates/reads
// them.

export type TranslationFieldKind = 'label' | 'html';

export interface TranslationField {
  /** Component key from the source form schema; stable across label edits. */
  key: string;
  /** Whether originalText is a component's label or an HTML/content block's body. */
  kind: TranslationFieldKind;
  /** Current label as of the last time this was recomputed from the form schema. */
  label: string;
  originalText: string;
  translatedText: string;
}

/**
 * A translation for text that recurs identically across multiple lessons
 * (tab labels, the Save button, prayer-section boilerplate, etc.) - shared
 * layout/chrome text, not lesson-specific content. Keyed by the literal
 * original text + locale rather than by any one lesson, since Form.io's own
 * i18n already looks translations up by the exact original string - see
 * CommonTranslationService.
 */
export interface CommonTranslation {
  id: string;
  originalText: string;
  kind: TranslationFieldKind;
  locale: string;
  localeLabel: string;
  translatedText: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface LessonTranslation {
  id: string;
  lessonId: string;
  locale: string;
  localeLabel: string;
  fields: TranslationField[];
  /** Translated counterparts of the Lesson's daily-reading fields, if any. */
  memoryVerse?: string;
  dailyReadingVerse?: string;
  goal?: string;
  monVerse?: string;
  tueVerse?: string;
  wedVerse?: string;
  thuVerse?: string;
  friVerse?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

/** Discriminates which kind of node in the treeview is selected/being created. */
export type LibraryNodeType = 'series' | 'book' | 'unit' | 'lesson';

/**
 * Translated name for a series/book/unit/lesson, stored in its own top-level
 * collection (not nested under the node) so an external client can look up any
 * node's translated name uniformly, regardless of type. Document id is always
 * `${nodeType}_${nodeId}_${locale}`, which both enforces one translation per
 * node per locale and lets a client fetch a specific one without a query.
 */
export interface TitleTranslation {
  id: string;
  nodeType: LibraryNodeType;
  nodeId: string;
  locale: string;
  localeLabel: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}
