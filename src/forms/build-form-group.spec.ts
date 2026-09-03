import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldDef } from '../shared/models/domain/form-field.model';
import { buildFormGroup } from './build-form-group';

// Pure function - no DI at all, so no TestBed needed here.
//
// This builds the FormGroup behind every custom form the Form Builder
// produces, so a mistake shows up as a field that can never be filled in or
// a submission missing a value, on a form an admin authored rather than a
// developer.
//
// IT NOW COVERS THE PUBLIC SITE TOO, which is the point of the move. This
// spec used to live in the admin app and protect only the admin's copy; the
// web app had its own hand-synced duplicate with NO tests at all - and the
// web one is where actual visitors type their name, email and address. One
// implementation, one spec, both apps.
//
// (Admin's karma run includes src/common/**/*.spec.ts; the web's excludes
// it. So this file runs once, in the admin suite, and guards both.)

const field = (over: Partial<FormFieldDef>): FormFieldDef =>
  ({ id: 'f1', type: 'text', label: 'Field', ...over }) as FormFieldDef;

/** The old two-arg shape, so the ported cases below read as they did. */
const noValidators = { applyValidators: false };
const withValidators = { applyValidators: true };

describe('buildFormGroup', () => {
  describe('control creation', () => {
    it('keys controls by field id, flat, whatever the nesting', () => {
      const group = buildFormGroup([
        field({ id: 'firstName' }),
        field({ id: 'lastName' }),
      ], noValidators);
      expect(Object.keys(group.controls).sort()).toEqual(['firstName', 'lastName']);
    });

    it('starts a plain text field as an empty string', () => {
      const group = buildFormGroup([field({ id: 'note' })], noValidators);
      expect(group.get('note')!.value).toBe('');
    });

    it('starts a checkbox as false, not empty string', () => {
      const group = buildFormGroup([field({ id: 'agree', type: 'checkbox' })], noValidators);
      expect(group.get('agree')!.value).toBeFalse();
    });

    it('starts a checkbox GROUP as an empty array', () => {
      const group = buildFormGroup([field({ id: 'picks', type: 'checkboxes' })], noValidators);
      expect(group.get('picks')!.value).toEqual([]);
    });
  });

  describe('the date control, which is why the two copies had drifted', () => {
    it('starts as NULL for mat-datepicker, which rejects an empty string', () => {
      const group = buildFormGroup(
        [field({ id: 'when', type: 'date' })], { ...noValidators, dateAs: 'Date' });
      expect(group.get('when')!.value).toBeNull();
    });

    it('starts as an empty STRING for a plain date input', () => {
      const group = buildFormGroup(
        [field({ id: 'when', type: 'date' })], { ...noValidators, dateAs: 'string' });
      expect(group.get('when')!.value).toBe('');
    });

    it('defaults to the string form, so the public site needs no options', () => {
      expect(buildFormGroup([field({ id: 'when', type: 'date' })]).get('when')!.value).toBe('');
    });
  });

  describe('composite fields', () => {
    it('builds address as its own nested group with the five parts', () => {
      const group = buildFormGroup([field({ id: 'home', type: 'address' })], noValidators);
      const address = group.get('home') as FormGroup;
      expect(address instanceof FormGroup).toBeTrue();
      expect(Object.keys(address.controls).sort())
        .toEqual(['address1', 'address2', 'city', 'state', 'zip']);
    });

    it('builds phone as its own nested group', () => {
      const group = buildFormGroup([field({ id: 'mobile', type: 'phone' })], noValidators);
      const phone = group.get('mobile') as FormGroup;
      expect(phone instanceof FormGroup).toBeTrue();
      expect(Object.keys(phone.controls).sort()).toEqual(['countryCode', 'number', 'type']);
    });
  });

  describe('layout fields', () => {
    it('creates no control for structural fields', () => {
      // heading/instructions/image/divider carry no submitted value; a
      // control for them would put junk in every submission.
      const group = buildFormGroup([
        field({ id: 'h', type: 'heading' }),
        field({ id: 'note', type: 'instructions' }),
        field({ id: 'rule', type: 'divider' }),
        field({ id: 'real' }),
      ], noValidators);
      expect(Object.keys(group.controls)).toEqual(['real']);
    });

    it('does not throw on a field type this build has never heard of', () => {
      // The null-safe lookup, which only the web's copy had. A form authored
      // by a newer admin than the site deploys must not take the whole page
      // down - the unknown field is skipped and the rest still renders.
      const group = buildFormGroup([
        field({ id: 'mystery', type: 'not-a-real-type' as FormFieldDef['type'] }),
        field({ id: 'real' }),
      ], noValidators);
      expect(Object.keys(group.controls)).toContain('real');
    });

    it('recurses into every column of a columns container without controlling the container', () => {
      const group = buildFormGroup([
        field({
          id: 'row1',
          type: 'columns',
          columns: [
            { fields: [field({ id: 'left' })] },
            { fields: [field({ id: 'right' })] },
          ],
        } as Partial<FormFieldDef>),
      ], noValidators);

      expect(Object.keys(group.controls).sort()).toEqual(['left', 'right']);
      expect(group.get('row1')).toBeNull();
    });

    it('handles a columns field with no columns at all', () => {
      const group = buildFormGroup([field({ id: 'row1', type: 'columns' })], noValidators);
      expect(Object.keys(group.controls)).toEqual([]);
    });

    it('recurses through columns nested in columns', () => {
      const group = buildFormGroup([
        field({
          id: 'outer',
          type: 'columns',
          columns: [{
            fields: [field({
              id: 'inner',
              type: 'columns',
              columns: [{ fields: [field({ id: 'deep' })] }],
            } as Partial<FormFieldDef>)],
          }],
        } as Partial<FormFieldDef>),
      ], noValidators);
      expect(Object.keys(group.controls)).toEqual(['deep']);
    });
  });

  describe('validators', () => {
    it('APPLIES them by default - validation fails closed', () => {
      // The default matters more than it looks. A caller that forgets the
      // option gets the strict behaviour, so the failure mode of a mistake
      // is a form that complains, never one that quietly accepts a blank
      // required field on the public site.
      const group = buildFormGroup([field({ id: 'name', required: true })]);
      expect(group.get('name')!.valid).toBeFalse();
    });

    it('leaves a required field valid when validators are off', () => {
      // The builder's Live Preview never submits, so it must not show
      // "required" errors on a form the author is still editing.
      const group = buildFormGroup([field({ id: 'name', required: true })], noValidators);
      expect(group.get('name')!.valid).toBeTrue();
    });

    it('marks a required field invalid when validators are on', () => {
      const group = buildFormGroup([field({ id: 'name', required: true })], withValidators);
      expect(group.get('name')!.valid).toBeFalse();
    });

    it('leaves an optional field valid either way', () => {
      const group = buildFormGroup([field({ id: 'name', required: false })], withValidators);
      expect(group.get('name')!.valid).toBeTrue();
    });

    it('requires a required checkbox to be TICKED, not merely present', () => {
      const group = buildFormGroup(
        [field({ id: 'agree', type: 'checkbox', required: true })], withValidators);
      const control = group.get('agree') as FormControl;
      expect(control.valid).toBeFalse();
      control.setValue(true);
      expect(control.valid).toBeTrue();
    });

    it('requires the meaningful parts of an address, but not address2', () => {
      const group = buildFormGroup(
        [field({ id: 'home', type: 'address', required: true })], withValidators);
      const address = group.get('home') as FormGroup;
      expect(address.get('address1')!.valid).toBeFalse();
      expect(address.get('city')!.valid).toBeFalse();
      expect(address.get('address2')!.valid).toBeTrue();
    });

    it('requires a phone number but not its country code or type', () => {
      const group = buildFormGroup(
        [field({ id: 'mobile', type: 'phone', required: true })], withValidators);
      const phone = group.get('mobile') as FormGroup;
      expect(phone.get('number')!.valid).toBeFalse();
      expect(phone.get('countryCode')!.valid).toBeTrue();
      expect(phone.get('type')!.valid).toBeTrue();
    });

    it('applies required through a columns container too', () => {
      const group = buildFormGroup([
        field({
          id: 'row',
          type: 'columns',
          columns: [{ fields: [field({ id: 'nested', required: true })] }],
        } as Partial<FormFieldDef>),
      ], withValidators);
      expect(group.get('nested')!.valid).toBeFalse();
    });
  });

  describe('edge cases', () => {
    it('returns an empty group for no fields', () => {
      expect(Object.keys(buildFormGroup([], withValidators).controls)).toEqual([]);
    });
  });
});
