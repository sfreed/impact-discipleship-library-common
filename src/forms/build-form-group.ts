import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormFieldDef, isLayoutFieldType } from '../shared/models/domain/form-field.model';

// THE ONE PLACE A FORM DEFINITION BECOMES A REAL FORM.
//
// The admin app builds forms and the public web site renders them, so both
// have to turn the same stored `fields[]` into an Angular FormGroup. Until
// 2026-09-03 each carried its OWN COPY of this file, and the web one said so
// at the top: "identical logic, kept in sync by hand".
//
// They had already drifted, which is what hand-syncing always comes to:
// different signatures, a different layout check, and - the one that
// mattered - a different control type for `date`. Worse, the copy with 7KB
// of tests was the ADMIN one, the internal tool; the copy with none was the
// WEB one, which is where actual visitors type their name and address. The
// tested half was the half that mattered least.
//
// The two knobs below are the differences that were REAL, kept as options
// rather than flattened away:
//
//   applyValidators - the admin builder's Live Preview passes false. Nothing
//     is ever submitted there, and a preview that shouts "required" at a
//     form you are still drawing is just noise. Everywhere else wants true,
//     which is why it is the DEFAULT: a caller that forgets gets the strict
//     behaviour, not the lax one. Validation should fail closed.
//
//   dateAs - the admin renders dates with mat-datepicker, which needs a real
//     Date|null; the web renders a plain <input type="date">, which needs a
//     string. This was silent drift between the copies and is a genuine
//     difference in what the two UIs bind to, so it stays a choice. 'string'
//     is the default so the web's call site reads `buildFormGroup(fields)`.
//
// Builds ONE FLAT top-level group keyed by each data field's own id,
// including fields nested inside a 'columns' container - that container
// recurses into both column arrays but never becomes a control itself, being
// structural rather than a value. Address and Phone are the two exceptions
// that are themselves nested FormGroups, matching what the field components
// on both sides bind their [group] input to.

export interface BuildFormGroupOptions {
  /** False only for the admin builder's Live Preview. Defaults to true. */
  applyValidators?: boolean;
  /** 'Date' for mat-datepicker (admin), 'string' for a plain date input. */
  dateAs?: 'Date' | 'string';
}

export function buildFormGroup(
  fields: FormFieldDef[],
  options: BuildFormGroupOptions = {}
): FormGroup {
  const group = new FormGroup({});
  addControls(fields, group, {
    applyValidators: options.applyValidators ?? true,
    dateAs: options.dateAs ?? 'string'
  });
  return group;
}

function addControls(
  fields: FormFieldDef[],
  group: FormGroup,
  options: Required<BuildFormGroupOptions>
): void {
  for (const field of fields) {
    if (field.type === 'columns') {
      (field.columns ?? []).forEach((column) => addControls(column.fields, group, options));
      continue;
    }
    // isLayoutFieldType(), not FIELD_TYPE_META[type].isLayout - it is the
    // same lookup but null-safe, so a field type this build has never heard
    // of is skipped rather than throwing and taking the whole form with it.
    if (isLayoutFieldType(field.type)) {
      continue; // heading/instructions/image/divider - structural, no submitted value.
    }

    const required = options.applyValidators && !!field.required;

    if (field.type === 'address') {
      group.addControl(
        field.id,
        new FormGroup({
          address1: new FormControl('', required ? [Validators.required] : []),
          address2: new FormControl(''),
          city: new FormControl('', required ? [Validators.required] : []),
          state: new FormControl('', required ? [Validators.required] : []),
          zip: new FormControl('', required ? [Validators.required] : [])
        })
      );
      continue;
    }

    if (field.type === 'phone') {
      group.addControl(
        field.id,
        new FormGroup({
          countryCode: new FormControl(''),
          number: new FormControl('', required ? [Validators.required] : []),
          type: new FormControl(null)
        })
      );
      continue;
    }

    if (field.type === 'checkbox') {
      group.addControl(field.id, new FormControl(false, required ? [Validators.requiredTrue] : []));
      continue;
    }

    if (field.type === 'checkboxes') {
      group.addControl(field.id, new FormControl<string[]>([], required ? [Validators.required] : []));
      continue;
    }

    if (field.type === 'date') {
      group.addControl(
        field.id,
        options.dateAs === 'Date'
          ? new FormControl<Date | null>(null, required ? [Validators.required] : [])
          : new FormControl<string>('', required ? [Validators.required] : [])
      );
      continue;
    }

    group.addControl(field.id, new FormControl('', required ? [Validators.required] : []));
  }
}
