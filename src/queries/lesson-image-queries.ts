// Shared read side of lesson-image hydration - both apps resolve
// `lessonimage:{id}` placeholders in a Form.io schema to real data URIs before
// handing it to Formio.builder/Formio.createForm. Reconciled during
// extraction: the manager's previous hydrateSchema had no try/catch around
// each image's getDoc call, so one unreachable image (e.g. offline, never
// previously cached) would throw and blank out the entire lesson/builder;
// this adopts the reader's per-image try/catch, which is strictly safer and
// was already relied on there for exactly that scenario (see
// OfflinePrefetchService). The manager keeps uploadImage/getImageDataUri/
// dehydrateSchema locally (reader has no use for them - it never authors
// content).

import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { FormioComponent, FormioSchema } from '../models/library.models';
import { HTML_TYPES, LESSON_IMAGE_PLACEHOLDER_RE } from '../formio/form-translation.util';

/** Replaces every `lessonimage:{id}` reference in the schema with its real
 *  data URI, fetched from Firestore. Deep-clones the schema it's given and
 *  never mutates the caller's copy. An id that can't be resolved (a dangling
 *  reference, or an offline fetch failure) is left as the placeholder rather
 *  than throwing - one bad/unreachable image reference must never blank out
 *  an entire lesson. */
export async function hydrateFormioSchema(firestore: Firestore, schema: FormioSchema | null): Promise<FormioSchema | null> {
  if (!schema) {
    return schema;
  }
  const clone = deepClone(schema);
  const htmlComponents = collectHtmlComponents(clone.components);

  const ids = new Set<string>();
  for (const component of htmlComponents) {
    const html = component['html'];
    if (typeof html !== 'string') {
      continue;
    }
    for (const match of html.matchAll(LESSON_IMAGE_PLACEHOLDER_RE)) {
      ids.add(match[1]);
    }
  }
  if (ids.size === 0) {
    return clone;
  }

  const dataUriById = new Map<string, string>();
  await Promise.all(
    [...ids].map(async (id) => {
      // Each fetch is independently caught: unlike the docData/collectionData
      // reads used elsewhere in the app, this one-shot getDoc *throws* when
      // offline and this particular image was never previously cached - one
      // unreachable image must never abort resolving the rest of the
      // lesson's images.
      try {
        const snap = await getDoc(doc(firestore, 'lessonImages', id));
        if (snap.exists()) {
          dataUriById.set(id, (snap.data()['dataUri'] as string) ?? '');
        }
      } catch {
        // Left unresolved - same as a dangling reference, see doc comment above.
      }
    }),
  );

  for (const component of htmlComponents) {
    const html = component['html'];
    if (typeof html !== 'string') {
      continue;
    }
    component['html'] = html.replace(LESSON_IMAGE_PLACEHOLDER_RE, (tag, id) => {
      const dataUri = dataUriById.get(id);
      return dataUri ? tag.replace(`lessonimage:${id}`, dataUri) : tag;
    });
  }
  return clone;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Same recursive shape as form-translation.util.ts's walkComponents (nested
 *  components/columns/rows), but only collects html/content components -
 *  returns direct references into `components` so callers can mutate `html`
 *  in place. */
function collectHtmlComponents(components: FormioComponent[] | undefined): FormioComponent[] {
  const out: FormioComponent[] = [];
  for (const component of components ?? []) {
    if (HTML_TYPES.has(component.type)) {
      out.push(component);
    }
    out.push(...collectHtmlComponents(component['components'] as FormioComponent[] | undefined));
    const columns = component['columns'] as { components: FormioComponent[] }[] | undefined;
    for (const column of columns ?? []) {
      out.push(...collectHtmlComponents(column.components));
    }
    const rows = component['rows'];
    if (Array.isArray(rows)) {
      for (const row of rows as FormioComponent[][]) {
        out.push(...collectHtmlComponents(row));
      }
    }
  }
  return out;
}
