// A custom Form.io component: a draggable "dynamic field" placeholder that, when
// the lesson it ends up in is actually rendered, displays that lesson's (or its
// unit/book/series') value for a chosen field - e.g. drop it into a template once,
// and it shows the memory verse of whichever lesson the template gets applied to.
//
// Registered globally via registerLibraryFieldComponent() (called once at app
// bootstrap - see main.ts) before any Formio.builder()/Formio.createForm() call.
//
// eslint-disable @typescript-eslint/no-explicit-any -- the @formio/js base Component
// class itself is only loosely typed (most members are `any`), so fighting that here
// would just produce noise, not safety.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Components } from '@formio/js';
// Deep import: @formio/js does not re-export the base Component class from its
// package root. Importing straight from its implementation path is the documented
// way to build a custom Form.io component (mirrors how @formio/js's own built-in
// components, e.g. Content, extend this same class).
// eslint-disable-next-line import/no-internal-modules
import FormioComponent from '@formio/js/lib/cjs/components/_classes/component/Component';

export type LibraryFieldSource = 'lesson' | 'unit' | 'book' | 'series';

/** Resolved field values for the current render context, keyed by source. */
export interface LibraryFieldContext {
  lesson?: Record<string, string | undefined>;
  unit?: Record<string, string | undefined>;
  book?: Record<string, string | undefined>;
  series?: Record<string, string | undefined>;
}

const SOURCE_LABELS: Record<LibraryFieldSource, string> = {
  lesson: 'Lesson',
  unit: 'Unit',
  book: 'Book',
  series: 'Series',
};

const FIELDS_BY_SOURCE: Record<LibraryFieldSource, { label: string; value: string }[]> = {
  lesson: [
    { label: 'Title', value: 'title' },
    { label: 'Memory Verse', value: 'memoryVerse' },
    { label: 'Monday Verse', value: 'monVerse' },
    { label: 'Tuesday Verse', value: 'tueVerse' },
    { label: 'Wednesday Verse', value: 'wedVerse' },
    { label: 'Thursday Verse', value: 'thuVerse' },
    { label: 'Friday Verse', value: 'friVerse' },
    { label: 'Goal', value: 'goal' },
    { label: 'Daily Reading Verse', value: 'dailyReadingVerse' },
  ],
  unit: [{ label: 'Title', value: 'title' }],
  book: [
    { label: 'Title', value: 'title' },
    { label: 'Author', value: 'author' },
    { label: 'Year', value: 'year' },
  ],
  series: [{ label: 'Title', value: 'title' }],
};

const FIELD_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  Object.values(FIELDS_BY_SOURCE)
    .flat()
    .map((f) => [f.value, f.label]),
);

const SIZE_OPTIONS = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Extra Large', value: 'x-large' },
];

// em, not px, so the size stays relative to whatever text surrounds it in the
// rendered lesson rather than a fixed absolute size.
const SIZE_CSS: Record<string, string> = {
  small: '0.85em',
  normal: '1em',
  large: '1.25em',
  'x-large': '1.5em',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class LibraryFieldComponent extends (FormioComponent as any) {
  static schema(...extend: any[]): any {
    return FormioComponent.schema(
      {
        type: 'libraryField',
        label: 'Library Field',
        key: 'libraryField',
        input: false,
        source: 'lesson',
        field: 'title',
        bold: false,
        italic: false,
        size: 'normal',
        align: 'left',
        showLabel: false,
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'Library Field',
      group: 'basic',
      icon: 'link',
      weight: 25,
      documentation: '',
      schema: LibraryFieldComponent.schema(),
    };
  }

  get defaultSchema() {
    return LibraryFieldComponent.schema();
  }

  private get placeholderText(): string {
    const self = this as any;
    const source = self.component.source as LibraryFieldSource;
    const sourceLabel = SOURCE_LABELS[source] ?? source;
    const fieldLabel = FIELD_LABEL_BY_VALUE[self.component.field] ?? self.component.field;
    return `[${sourceLabel}: ${fieldLabel}]`;
  }

  /** The actual resolved value for the current render context - undefined in
   *  the builder, or if that value isn't available yet, in which case callers
   *  fall back to `placeholderText`. Kept distinct from `rawText` so `content`
   *  can tell whether it's showing a real value (and so should prefix the
   *  optional field-name label) or just the builder placeholder (which the
   *  label never applies to). */
  private get resolvedValue(): string | undefined {
    const self = this as any;
    if (self.builderMode) {
      return undefined;
    }
    const context = self.options?.libraryContext as LibraryFieldContext | undefined;
    const source = self.component.source as LibraryFieldSource;
    const sourceData = context?.[source];
    const value = sourceData?.[self.component.field];
    return value?.trim() ? value : undefined;
  }

  private get rawText(): string {
    return this.resolvedValue ?? this.placeholderText;
  }

  get content(): string {
    const self = this as any;
    const styles: string[] = [];
    if (self.component.bold) {
      styles.push('font-weight: bold');
    }
    if (self.component.italic) {
      styles.push('font-style: italic');
    }
    const sizeCss = SIZE_CSS[self.component.size as string];
    if (sizeCss && self.component.size !== 'normal') {
      styles.push(`font-size: ${sizeCss}`);
    }

    const resolvedValue = this.resolvedValue;
    if (resolvedValue === undefined && !self.builderMode) {
      // Nothing resolved and this isn't the builder - the bracketed
      // placeholder is a builder-only hint (see placeholderText), not real
      // lesson content, so a published lesson with a genuinely blank source
      // value renders nothing here instead of leaking "[Lesson: ...]" text.
      return '';
    }

    let inner = escapeHtml(resolvedValue ?? this.placeholderText);
    // Only the real resolved value gets the field-name label prefix - never
    // the builder's bracketed placeholder, which already names the field.
    if (self.component.showLabel && resolvedValue !== undefined) {
      // Routed through Form.io's own translation lookup (same mechanism as
      // every other piece of lesson text) rather than rendered as a raw
      // English string, since this component builds its own HTML outside
      // Form.io's normal label-rendering path and so never picked up i18n
      // otherwise. These field names are managed as Common Translations.
      const fieldLabel = escapeHtml(self.t(FIELD_LABEL_BY_VALUE[self.component.field] ?? self.component.field));
      inner = `<b>${fieldLabel}</b>: ${inner}`;
    }
    return styles.length ? `<span style="${styles.join('; ')}">${inner}</span>` : inner;
  }

  render(): string {
    const self = this as any;
    return super.render(
      self.renderTemplate('html', {
        tag: 'span',
        attrs: [],
        content: this.content,
      }),
    );
  }

  attach(element: HTMLElement): Promise<void> {
    const self = this as any;
    // Sets alignment on the component's own outer wrapper (which Form.io always
    // renders as a block-level element), so the inline content span aligns within
    // whatever container - column, panel, or the plain form body - this component
    // sits in.
    element.style.textAlign = self.component.align || 'left';
    self.loadRefs(element, { html: 'single' });
    if (self.refs.html) {
      self.setContent(self.refs.html, this.content, false, undefined);
    }
    return super.attach(element);
  }

  get emptyValue(): string {
    return '';
  }
}

function fieldSelect(source: LibraryFieldSource): Record<string, unknown> {
  return {
    type: 'select',
    input: true,
    key: 'field',
    label: 'Field',
    weight: 20,
    dataSrc: 'values',
    data: { values: FIELDS_BY_SOURCE[source] },
    defaultValue: FIELDS_BY_SOURCE[source][0].value,
    conditional: { json: { '===': [{ var: 'data.source' }, source] } },
  };
}

function libraryFieldEditForm(...extend: any[]) {
  return Components.baseEditForm(
    [
      {
        key: 'display',
        components: [
          { type: 'textfield', input: true, key: 'label', label: 'Label', weight: 0 },
          {
            type: 'select',
            input: true,
            key: 'source',
            label: 'Source',
            weight: 10,
            dataSrc: 'values',
            defaultValue: 'lesson',
            data: {
              values: [
                { label: 'Lesson', value: 'lesson' },
                { label: 'Unit', value: 'unit' },
                { label: 'Book', value: 'book' },
                { label: 'Series', value: 'series' },
              ],
            },
          },
          fieldSelect('lesson'),
          fieldSelect('unit'),
          fieldSelect('book'),
          fieldSelect('series'),
          {
            type: 'checkbox',
            input: true,
            key: 'showLabel',
            label: 'Show Field Label',
            tooltip: 'Prefixes the rendered value with the selected Field option\'s label in bold, e.g. "Memory Verse: ..."',
            weight: 24,
          },
          { type: 'checkbox', input: true, key: 'bold', label: 'Bold', weight: 25 },
          { type: 'checkbox', input: true, key: 'italic', label: 'Italic', weight: 26 },
          {
            type: 'select',
            input: true,
            key: 'size',
            label: 'Size',
            weight: 27,
            dataSrc: 'values',
            defaultValue: 'normal',
            data: { values: SIZE_OPTIONS },
          },
          {
            type: 'radio',
            input: true,
            key: 'align',
            label: 'Alignment',
            weight: 28,
            inline: true,
            optionsLabelPosition: 'bottom',
            customClass: 'library-field-align-buttons',
            defaultValue: 'left',
            values: [
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
              { label: 'Justify', value: 'justify' },
            ],
          },
        ],
      },
      { key: 'data', ignore: true },
      { key: 'validation', ignore: true },
      { key: 'api', ignore: true },
    ],
    ...extend,
  );
}

let registered = false;

/** Idempotent - safe to call more than once (e.g. across hot reloads). */
export function registerLibraryFieldComponent(): void {
  if (registered) {
    return;
  }
  registered = true;
  Components.setComponent('libraryField', LibraryFieldComponent);
  (LibraryFieldComponent as any).editForm = libraryFieldEditForm;
}
