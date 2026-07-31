// A custom Form.io component: a plain layout container (like the built-in Well/
// Panel components) that other components can be dropped into, with an editable
// background color. Unlike Form.io's own "Container" component, this does not
// namespace its children's data under a key - it's purely a visual/layout grouping,
// matching how Well behaves.
//
// Registered globally via registerColoredContainerComponent() (called once at app
// bootstrap - see main.ts) before any Formio.builder()/Formio.createForm() call.
//
// eslint-disable @typescript-eslint/no-explicit-any -- the @formio/js base
// NestedComponent class itself is only loosely typed (most members are `any`), so
// fighting that here would just produce noise, not safety.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Components } from '@formio/js';
// Deep import: @formio/js does not re-export NestedComponent from its package
// root. Importing straight from its implementation path is the documented way to
// build a custom container component (mirrors how @formio/js's own built-in
// container-like components, e.g. Well and Panel, extend this same class).
// eslint-disable-next-line import/no-internal-modules
import NestedComponent from '@formio/js/lib/cjs/components/_classes/nested/NestedComponent';

// Applied only once a background color is set, so with no color this behaves like
// a plain, invisible grouping container.
const CONTAINER_PADDING = '1em';
const CONTAINER_BORDER_RADIUS = '0.25em';

export class ColoredContainerComponent extends (NestedComponent as any) {
  static schema(...extend: any[]): any {
    return NestedComponent.schema(
      {
        type: 'coloredContainer',
        label: 'Colored Container',
        key: 'coloredContainer',
        input: false,
        persistent: false,
        clearOnHide: false,
        tableView: false,
        backgroundColor: '',
        components: [],
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'Colored Container',
      group: 'layout',
      icon: 'square',
      weight: 35,
      documentation: '',
      showPreview: false,
      schema: ColoredContainerComponent.schema(),
    };
  }

  static savedValueTypes(): string[] {
    return [];
  }

  get defaultSchema() {
    return ColoredContainerComponent.schema();
  }

  constructor(...args: any[]) {
    super(...args);
    (this as any).noField = true;
  }

  // Overriding attach() to poke `element.style` directly doesn't hold up: the
  // form builder redraws this component (e.g. whenever a child is dropped into
  // it) through paths that don't consistently call our attach() override, so a
  // DOM-mutation-after-the-fact approach loses the color. `customStyle` instead
  // gets baked into the `style` attribute of the *rendered HTML string* itself
  // (see Component's base render(), which does `styles: this.customStyle`), so it
  // survives every redraw in both the builder and the live form the same way.
  get customStyle(): string {
    const self = this as any;
    const backgroundColor = ((self.component.backgroundColor as string) || '').trim();
    let style = super.customStyle as string;
    if (backgroundColor) {
      style += `background-color:${backgroundColor};padding:${CONTAINER_PADDING};border-radius:${CONTAINER_BORDER_RADIUS};`;
    }
    return style;
  }
}

function coloredContainerEditForm(...extend: any[]) {
  return Components.baseEditForm(
    [
      {
        key: 'display',
        components: [
          // Component.edit.display's default fields that don't apply to a
          // non-input layout container (mirrors how @formio/js's own Well/Panel
          // components trim their edit forms) - without these, Form.io's
          // editForm merge (a lodash unionWith keyed by `key`, see
          // Component.form.js) adds every default display field back in
          // alongside ours instead of replacing them.
          { key: 'labelPosition', ignore: true },
          { key: 'labelWidth', ignore: true },
          { key: 'labelMargin', ignore: true },
          { key: 'placeholder', ignore: true },
          { key: 'description', ignore: true },
          { key: 'tooltip', ignore: true },
          { key: 'autofocus', ignore: true },
          { key: 'tabindex', ignore: true },
          { key: 'hidden', ignore: true },
          { key: 'hideLabel', ignore: true },
          { key: 'dataGridLabel', ignore: true },
          { key: 'disabled', ignore: true },
          { key: 'tableView', ignore: true },
          { key: 'modalEdit', ignore: true },
          { type: 'textfield', input: true, key: 'label', label: 'Label', weight: 0 },
          {
            // Plain text entry (any hex or rgb() string) with a native
            // color-picker swatch bolted on next to it - see
            // color-field.component.ts.
            type: 'colorField',
            input: true,
            key: 'backgroundColor',
            label: 'Background Color',
            placeholder: '#rrggbb or rgb(r, g, b)',
            tooltip: 'Type a hex or rgb color, or use the picker. Leave blank for no background.',
            weight: 10,
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
export function registerColoredContainerComponent(): void {
  if (registered) {
    return;
  }
  registered = true;
  Components.setComponent('coloredContainer', ColoredContainerComponent);
  (ColoredContainerComponent as any).editForm = coloredContainerEditForm;
}
