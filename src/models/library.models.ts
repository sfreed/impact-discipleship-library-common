// Shared Book -> Unit -> Lesson domain shapes, identical in both
// impact-discipleship-library-new and impact-discipleship-library-manager-new
// as of the extraction into this common library - both apps read/write the
// same Firestore documents, so these must stay in sync. Each app's own
// core/models/library.models.ts re-exports these plus its own app-specific
// additions (BookSeries, AppUser, etc. for the manager app).

export interface BookLanguage {
  id: string;
  language: string;
  abbreviation: string;
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
