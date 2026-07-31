// A custom Form.io component: a plain text field (accepts any CSS color -
// #rrggbb hex or rgb(r, g, b)) with a native color-picker swatch bolted on next
// to it as a convenience for filling that text in. Not draggable in the form
// builder palette on purpose (no builderInfo) - this exists purely as a field
// type for other components' edit forms to reference (see
// colored-container.component.ts's "Background Color" field), not as something
// authors drop into lesson content themselves.
//
// Registered globally via registerColorFieldComponent() (called once at app
// bootstrap - see main.ts) before any Formio.builder()/Formio.createForm() call.
//
// eslint-disable @typescript-eslint/no-explicit-any -- the @formio/js base
// TextField class itself is only loosely typed (most members are `any`), so
// fighting that here would just produce noise, not safety.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Components } from '@formio/js';
// Deep import: @formio/js does not re-export TextField from its package root.
// Importing straight from its implementation path is the documented way to
// build a custom component that extends an existing one.
// eslint-disable-next-line import/no-internal-modules
import TextFieldComponent from '@formio/js/lib/cjs/components/textfield/TextField';

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_PATTERN = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i;

/** Converts a "#rgb"/"#rrggbb" hex or "rgb(r, g, b)" string to strict "#rrggbb" - the
 * only format a native `<input type="color">` accepts - or null if it's neither
 * (e.g. empty, or a value the picker just can't represent). */
function toHexColor(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return null;
  }

  const hexMatch = HEX_PATTERN.exec(trimmed);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3
      ? `#${hex
          .split('')
          .map((c) => c + c)
          .join('')}`.toLowerCase()
      : `#${hex.toLowerCase()}`;
  }

  const rgbMatch = RGB_PATTERN.exec(trimmed);
  if (rgbMatch) {
    const toHex = (n: string) => Math.min(255, parseInt(n, 10)).toString(16).padStart(2, '0');
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
  }

  return null;
}

export class ColorFieldComponent extends (TextFieldComponent as any) {
  static schema(...extend: any[]): any {
    return TextFieldComponent.schema(
      {
        type: 'colorField',
        key: 'colorField',
        label: 'Color',
        placeholder: '#rrggbb or rgb(r, g, b)',
        tableView: false,
      },
      ...extend,
    );
  }

  get defaultSchema() {
    return ColorFieldComponent.schema();
  }

  attach(element: HTMLElement): Promise<void> {
    const promise = super.attach(element);
    this.attachColorPicker();
    return promise;
  }

  // Bolted on with plain DOM APIs rather than through render()'s HTML-string
  // pipeline (e.g. the `suffix`/`prefix` addon slots that pipeline supports) -
  // those addons get passed through Form.io's sanitizer as untrusted "user
  // input" HTML, which is liable to strip an interactive <input> element. This
  // runs fresh on every attach(), including after a redraw (Component.redraw()
  // calls this.attach(this.element) again), so it stays in sync rather than
  // relying on the picker surviving a DOM replacement it wasn't part of.
  private attachColorPicker(): void {
    const self = this as any;
    const textInput = self.refs?.input?.[0] as HTMLInputElement | undefined;
    if (!textInput || !textInput.parentElement) {
      return;
    }

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-field-picker';
    colorInput.setAttribute('aria-label', 'Pick a color');
    colorInput.value = toHexColor(textInput.value) || '#ffffff';

    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value;
      // Dispatching a real 'input' event (rather than calling Form.io's
      // internal update methods directly) routes through the exact same
      // listener Form.io already wired up to the text input, so change
      // detection/validation/dirty-tracking all behave as if the user typed it.
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    textInput.addEventListener('input', () => {
      const hex = toHexColor(textInput.value);
      if (hex) {
        colorInput.value = hex;
      }
    });

    // The text input is a block-level .form-control, so just inserting the
    // picker as its next sibling would drop it onto its own line - wrap both in
    // a flex row instead (styled globally in styles.scss, .color-field-row).
    const row = document.createElement('div');
    row.className = 'color-field-row';
    textInput.insertAdjacentElement('beforebegin', row);
    row.append(textInput, colorInput);
  }
}

let registered = false;

/** Idempotent - safe to call more than once (e.g. across hot reloads). */
export function registerColorFieldComponent(): void {
  if (registered) {
    return;
  }
  registered = true;
  Components.setComponent('colorField', ColorFieldComponent);
}
