// The libraryField component's CONTEXT contract, split into its own
// @formio/js-free module: the reader app renders libraryField natively
// (mat-lesson-blocks walks the stored schema) and only needs these types -
// importing them from library-field.component.ts would drag the whole
// @formio/js dependency into its compilation, which the reader no longer
// installs at all (the Form.io escape-hatch renderer was retired 2026-08).
// library-field.component.ts (the manager app's authoring-side custom
// component) re-exports these so its existing imports keep working.

export type LibraryFieldSource = 'lesson' | 'unit' | 'book' | 'series';

/** Resolved field values for the current render context, keyed by source. */
export interface LibraryFieldContext {
  lesson?: Record<string, string | undefined>;
  unit?: Record<string, string | undefined>;
  book?: Record<string, string | undefined>;
  series?: Record<string, string | undefined>;
}
