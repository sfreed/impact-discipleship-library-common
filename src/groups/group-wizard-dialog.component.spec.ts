import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GroupWizardDialogComponent, GroupWizardDialogData } from './group-wizard-dialog.component';
import { DiscussionGroup } from '../models/discussion-group.model';
import { CHROME_TEXT_SERVICE, NOOP_CHROME_TEXT_SERVICE } from '../chrome-text/chrome-text.token';

const sourceGroup: DiscussionGroup = {
  id: 'group-1',
  bookId: 'book-1',
  title: 'Tuesday Night Discussion',
  creatorEmail: 'leader@example.com',
  creatorDisplayName: 'Leader Name',
  startDate: Date.parse('2026-01-01'),
  status: 'open',
  groupVisibility: 'public',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function createComponent(data: GroupWizardDialogData): GroupWizardDialogComponent {
  TestBed.configureTestingModule({
    providers: [
      { provide: MatDialogRef, useValue: { close: () => {} } },
      { provide: MAT_DIALOG_DATA, useValue: data },
      // The wizard translates its own chrome text - the passthrough is
      // exactly what a unit test wants (assertions read the English text).
      { provide: CHROME_TEXT_SERVICE, useValue: NOOP_CHROME_TEXT_SERVICE },
    ],
  });
  return TestBed.createComponent(GroupWizardDialogComponent).componentInstance;
}

describe('GroupWizardDialogComponent', () => {
  it('plain create: neither edit nor clone mode, book field starts blank', () => {
    const component = createComponent({ books: [] });
    expect(component.isEditMode).toBeFalse();
    expect(component.isCloneMode).toBeFalse();
    expect(component.formBookId()).toBe('');
    expect(component.formTitle()).toBe('');
  });

  it('edit mode: prefills every field including bookId, and is not clone mode', () => {
    const component = createComponent({ books: [], existingGroup: sourceGroup });
    expect(component.isEditMode).toBeTrue();
    expect(component.isCloneMode).toBeFalse();
    expect(component.formBookId()).toBe(sourceGroup.bookId);
    expect(component.formTitle()).toBe(sourceGroup.title);
  });

  it('clone mode: prefills every field except bookId, which stays blank', () => {
    const component = createComponent({ books: [], cloneFrom: sourceGroup });
    expect(component.isEditMode).toBeFalse();
    expect(component.isCloneMode).toBeTrue();
    expect(component.formBookId()).toBe('');
    expect(component.formTitle()).toBe(sourceGroup.title);
    expect(component.formGroupVisibility()).toBe('public');
  });

  it('existingGroup wins if both existingGroup and cloneFrom are somehow set', () => {
    const otherGroup: DiscussionGroup = { ...sourceGroup, id: 'group-2', bookId: 'book-2' };
    const component = createComponent({ books: [], existingGroup: sourceGroup, cloneFrom: otherGroup });
    expect(component.isEditMode).toBeTrue();
    expect(component.isCloneMode).toBeFalse();
    expect(component.formBookId()).toBe(sourceGroup.bookId);
  });
});
