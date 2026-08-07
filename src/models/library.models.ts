// Shared Series -> Book -> Unit -> Lesson domain shapes, identical in both
// impact-discipleship-library-new and impact-discipleship-library-manager-new
// as of the extraction into this common library - both apps read/write the
// same Firestore documents, so these must stay in sync. Each app's own
// core/models/library.models.ts re-exports these plus its own app-specific
// additions (AppUser, etc. for the manager app).

export interface BookLanguage {
  id: string;
  language: string;
  abbreviation: string;
}

/** A top-level grouping of books (e.g. "Impact Discipleship"), stored in its
 *  own `series` collection - `Book.seriesId` points back to one of these.
 *  Originally manager-only (series authoring is manager-app-only), moved
 *  here once the reader app also needed series titles/order to group books
 *  by series on the Store and My Books pages. */
export interface BookSeries {
  id: string;
  title: string;
  description?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  /** uid of the user who created this record. */
  createdBy: string;
  /** uid of the user who last updated this record. */
  updatedBy: string;
}

export interface Book {
  id: string;
  seriesId: string;
  title: string;
  description?: string;
  year?: string;
  author?: string;
  /** Languages this book's lessons are available in. */
  languages?: BookLanguage[];
  /** Whether this book is visible in the reader app. Missing/undefined is
   *  treated as published (true) so every book that existed before this field
   *  was introduced keeps showing exactly as it did before - only an explicit
   *  `false` hides a book. Toggled from the manager app's library tree ("..."
   *  menu on a book row); enforced client-side only in the reader app (see
   *  LibraryService.getBooksForUser there), not in firestore.rules - a direct
   *  link to an unpublished book's content is not blocked. */
  published?: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface Unit {
  id: string;
  bookId: string;
  title: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export type LessonStatus = 'draft' | 'published';

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  order: number;
  status: LessonStatus;
  /** Form.io form schema describing the lesson content. */
  formSchema: FormioSchema | null;
  /** Whether this lesson has an accompanying weekday devotional reading plan. */
  showDailyReading?: boolean;
  dailyReadingVerse?: string;
  goal?: string;
  memoryVerse?: string;
  monVerse?: string;
  tueVerse?: string;
  wedVerse?: string;
  thuVerse?: string;
  friVerse?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  /** Date-based build number, e.g. "2026.07.27.2" - the trailing count resets to 1
   *  each new calendar day and increments on every content save that same day. */
  version?: string;
}

/** Minimal shape of a Form.io form schema; components are intentionally loose. */
export interface FormioSchema {
  display?: string;
  components: FormioComponent[];
}

export interface FormioComponent {
  key: string;
  type: string;
  label?: string;
  [prop: string]: unknown;
}
