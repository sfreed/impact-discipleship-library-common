import { FormioComponent, FormioSchema } from '../models/library.models';
import { TranslationField } from '../models/translation.models';

// Exported so LessonImageService can walk the same html/content components
// when hydrating/dehydrating embedded images, without re-deriving this list.
export const HTML_TYPES = new Set(['htmlelement', 'content']);
// Layout/structural components whose own `label` (if any) is internal bookkeeping,
// not text a lesson viewer ever sees, so it isn't worth surfacing for translation.
// `libraryField` is excluded too: its displayed value is auto-resolved from the
// lesson/unit/book/series data (and their own translations) at render time, not
// hand-translated text.
const LAYOUT_TYPES = new Set([
  'panel',
  'well',
  'fieldset',
  'columns',
  'table',
  'tabs',
  'form',
  'container',
  'libraryField',
  // Custom layout wrapper (colored-container.component.ts) - `input: false`,
  // renders only its children. Its `label` is just the Form.io builder's
  // bookkeeping name for the component (same role as Well/Panel's), never
  // shown to a lesson viewer - confirmed by rendering it standalone and
  // checking the output contains no trace of the label text.
  'coloredContainer',
]);

/**
 * Walks a Form.io schema and pulls out every human-readable string a translator
 * would need to work with: each component's current label, and the body text of
 * html/content components. Nested components (panels, columns, etc.) are walked
 * recursively via their `components`/`columns`/`rows` arrays.
 *
 * Always recomputed from the live schema (never cached) so that renaming a label
 * in the Form.io builder is reflected immediately on the translation page.
 */
export function extractTranslatableFields(schema: FormioSchema | null): TranslationField[] {
  if (!schema?.components?.length) {
    return [];
  }

  const fields: TranslationField[] = [];
  walkComponents(schema.components, fields, new Set<string>());
  return fields;
}

function walkComponents(components: FormioComponent[], out: TranslationField[], seenButtonText: Set<string>): void {
  for (const component of components) {
    if (HTML_TYPES.has(component.type)) {
      const html = component['html'];
      if (typeof html === 'string' && html.trim()) {
        out.push({
          key: component.key,
          kind: 'html',
          label: component.label || 'HTML Content',
          originalText: html,
          translatedText: '',
        });
      }
    } else if (!LAYOUT_TYPES.has(component.type) && !component['hideLabel'] && component.label?.trim()) {
      // `hideLabel: true` doesn't remove the label from the DOM - Form.io keeps
      // it for screen readers via a `visually-hidden` class (position:absolute,
      // 1x1px, clipped) - confirmed by inspecting the rendered element's box.
      // No sighted lesson viewer ever sees this text, so it isn't worth
      // surfacing for translation (most common case: a Notes-tab textarea whose
      // "Notes"/"Text Area" label is hidden in favor of the tab title alone).
      //
      // Buttons are additionally deduped by their text: a lesson typically has
      // several Save buttons (one per tab), all rendering identical text, and
      // Form.io's i18n translates by looking up the literal original string -
      // not by component key - so every button sharing that text already gets
      // the same translated text applied at render time regardless of how many
      // rows exist here. Showing one row per button let a translator set three
      // different translations for the same on-screen word, only one of which
      // would silently end up applying to all of them - one row per distinct
      // button text avoids that trap.
      const isDuplicateButton = component.type === 'button' && seenButtonText.has(component.label);
      if (!isDuplicateButton) {
        if (component.type === 'button') {
          seenButtonText.add(component.label);
        }
        out.push({
          key: component.key,
          kind: 'label',
          label: component.label,
          originalText: component.label,
          translatedText: '',
        });
      }
    }

    // Choice components (radio/checkbox/selectboxes put their options directly
    // on `values`; select nests them under `data.values`) render each option's
    // own `label` to the user as the visible choice text - confirmed by
    // rendering a select/radio standalone with an i18n resource map and
    // checking the option text actually swaps. Each option gets its own row so
    // it can be translated independently of its sibling options.
    const options =
      (component['values'] as { label?: string }[] | undefined) ??
      (component['data'] as { values?: { label?: string }[] } | undefined)?.values;
    if (Array.isArray(options)) {
      options.forEach((option, index) => {
        if (option?.label?.trim()) {
          out.push({
            key: `${component.key}_opt${index}`,
            kind: 'label',
            label: option.label,
            originalText: option.label,
            translatedText: '',
          });
        }
      });
    }

    const nested = (component['components'] as FormioComponent[] | undefined) ?? [];
    if (nested.length) {
      walkComponents(nested, out, seenButtonText);
    }

    const columns = (component['columns'] as { components: FormioComponent[] }[] | undefined) ?? [];
    for (const column of columns) {
      walkComponents(column.components ?? [], out, seenButtonText);
    }

    // `rows` also appears on unrelated component types (e.g. a textarea's visible
    // row count, a plain number) - only treat it as nested table/datagrid rows when
    // it's actually shaped that way.
    const rows = component['rows'];
    if (Array.isArray(rows)) {
      for (const row of rows as FormioComponent[][]) {
        walkComponents(row ?? [], out, seenButtonText);
      }
    }
  }
}

// Matches a content block that is *only* an embedded image (the CKEditor/Form.io
// image-upload widget's markup), e.g. `<figure class="image"><img src="lessonimage:1a2b3c">...</figure>`.
// Images themselves live in the `lessonImages` collection, referenced by this
// placeholder scheme rather than embedded inline - see LessonImageService.
const IMAGE_CONTENT_RE = /^<figure\b[^>]*>\s*<img\b[^>]*\ssrc="(lessonimage:[a-z0-9]+)"/i;

/**
 * If `html` is an image-only content block, returns its `lessonimage:{id}`
 * placeholder reference; otherwise null. Used by the translation page to
 * render an actual `<img>` for these fields instead of raw HTML - callers
 * resolve the placeholder to a real data URI via LessonImageService before
 * binding it to an `<img src>`.
 */
export function extractImageSrc(html: string): string | null {
  const match = IMAGE_CONTENT_RE.exec(html.trim());
  return match ? match[1] : null;
}

/** Swaps the `src` of the first `<img>` in `html` for `newSrc`, preserving every
 *  other attribute and wrapper markup (e.g. the figure's sizing class). */
export function replaceImageSrc(html: string, newSrc: string): string {
  return html.replace(/(<img\b[^>]*\ssrc=")[^"]*(")/i, `$1${newSrc}$2`);
}

// Finds every embedded base64 image `<img>` tag in a block of HTML (there can be
// more than one) - used by LessonImageService.dehydrateSchema to extract images
// out into their own `lessonImages` documents before the schema is persisted.
export const BASE64_IMAGE_RE = /<img\b[^>]*\ssrc="(data:image\/[^"]*)"[^>]*>/gi;

// Finds every `lessonimage:{id}` placeholder reference in a block of HTML -
// used by LessonImageService.hydrateSchema to know which lessonImages
// documents to fetch, and to substitute their real data URI back in for
// rendering.
export const LESSON_IMAGE_PLACEHOLDER_RE = /<img\b[^>]*\ssrc="lessonimage:([a-z0-9]+)"[^>]*>/gi;
