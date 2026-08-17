import { Component, Inject, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GeocodingService } from './geocoding.service';
import { DiscussionGroup, DiscussionGroupLocation } from '../models/discussion-group.model';
import { COUNTRIES } from './data/countries';
import { US_STATES } from './data/us-states';
import { TIME_ZONES } from './data/timezones';
import { combineDateTimeInZone, extractTimeInZone, formatGroupDateTime } from './group-datetime.util';
import { CHROME_TEXT_SERVICE } from '../chrome-text/chrome-text.token';

export interface GroupWizardBook {
  id: string;
  title: string;
}

export interface GroupWizardDialogData {
  books: GroupWizardBook[];
  /** Present only when editing an existing group - every field is
   *  pre-filled from it. Absent means "create a new group". */
  existingGroup?: DiscussionGroup;
  /** Present only when cloning a group for its next book - every field
   *  except `bookId` is pre-filled from it, same as edit mode, but
   *  submission is still a *create* (a brand-new group doc), never an
   *  update to this group. Ignored if `existingGroup` is also set - edit
   *  mode's behavior is more consequential to get right by accident, so it
   *  wins. `bookId` is deliberately left blank in this mode so the creator
   *  always picks the next book fresh from the same full list used for a
   *  normal create. */
  cloneFrom?: DiscussionGroup;
  /** Only meaningful alongside `cloneFrom`: pre-selects this book instead of
   *  leaving the Basics step's book picker blank - the reader app's
   *  "Promote to Next Book" flow (which already knows the next book by
   *  series order) uses this so the creator isn't asked to re-pick a book
   *  the app already figured out, while "Clone for a different book" (which
   *  omits this) still starts blank. Still a normal, editable mat-select -
   *  the creator can change it before submitting either way. */
  preselectedBookId?: string;
  /** Approved members (excluding the creator) this group currently has -
   *  supplied by the caller (which already has the membership data) rather
   *  than this wizard querying Firestore itself, keeping it independent of
   *  any app's own write service. Only meaningful in edit mode; used to
   *  reject shrinking "Group size" below a count already reached. */
  currentApprovedMemberCount?: number;
}

/** Everything the wizard collects, deliberately independent of any app's
 *  own write service - each app's own caller (reader app's own
 *  DiscussionGroupService.createGroup/updateGroup, or the manager app's
 *  equivalent) turns this into an actual Firestore write, adding whatever
 *  creator/audit fields only it knows about. Keeps this component reusable
 *  by both apps without depending on either one's app-specific service. */
export interface GroupWizardResult {
  bookId: string;
  title: string;
  description?: string;
  location?: DiscussionGroupLocation;
  onlineInfo?: string;
  startDate: number;
  startTimeZone: string;
  groupVisibility: 'public' | 'invite-only';
  maxMembers?: number;
}

type StepId = 'basics' | 'format' | 'location' | 'venue' | 'visibility' | 'review';

@Component({
  selector: 'common-group-wizard-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './group-wizard-dialog.component.html',
  styleUrl: './group-wizard-dialog.component.scss',
})
export class GroupWizardDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GroupWizardDialogComponent, GroupWizardResult>);
  private readonly geocodingService = inject(GeocodingService);
  readonly chrome = inject(CHROME_TEXT_SERVICE);

  readonly countries = COUNTRIES;
  readonly usStates = US_STATES;
  readonly timeZones = TIME_ZONES;

  readonly isEditMode: boolean;
  /** Prefilled-create ("clone") mode - see GroupWizardDialogData.cloneFrom. */
  readonly isCloneMode: boolean;

  // ---- Form state -----------------------------------------------------

  readonly formBookId = signal('');
  readonly formTitle = signal('');
  readonly formDescription = signal('');
  readonly formStartDate = signal<Date | null>(null);
  readonly formStartTime = signal('');
  // Auto-detected default, always editable - see the Basics step's timezone
  // select. A creator planning a group for a city other than their own can
  // change it; most people never have to think about it.
  readonly formTimeZone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);
  readonly formMaxMembers = signal<number | null>(null);

  readonly formOfferInPerson = signal(false);
  readonly formOfferOnline = signal(false);
  readonly formOnlineInfo = signal('');

  readonly formCountry = signal('US');
  readonly formState = signal('');
  readonly formCity = signal('');

  readonly formLocationType = signal<'public' | 'private'>('public');
  readonly formAddress1 = signal('');
  readonly formAddressVisible = signal(false);

  readonly formGroupVisibility = signal<'public' | 'invite-only'>('public');

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: GroupWizardDialogData) {
    this.isEditMode = !!data.existingGroup;
    this.isCloneMode = !this.isEditMode && !!data.cloneFrom;
    const existing = data.existingGroup ?? data.cloneFrom;
    if (existing) {
      if (!this.isCloneMode) {
        this.formBookId.set(existing.bookId);
      } else if (data.preselectedBookId) {
        this.formBookId.set(data.preselectedBookId);
      }
      this.formTitle.set(existing.title);
      this.formDescription.set(existing.description ?? '');
      this.formStartDate.set(new Date(existing.startDate));
      // Pre-existing groups saved before this field existed have no zone of
      // their own - fall back to the editor's own device zone, the only
      // information available for those.
      const zone = existing.startTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.formTimeZone.set(zone);
      this.formStartTime.set(extractTimeInZone(existing.startDate, zone));
      this.formMaxMembers.set(existing.maxMembers ?? null);
      this.formOfferOnline.set(!!existing.onlineInfo);
      this.formOnlineInfo.set(existing.onlineInfo ?? '');
      this.formGroupVisibility.set(existing.groupVisibility ?? 'public');

      if (existing.location) {
        this.formOfferInPerson.set(true);
        this.formCountry.set(existing.location.country);
        this.formState.set(existing.location.state ?? '');
        this.formCity.set(existing.location.city);
        this.formLocationType.set(existing.location.locationType);
        this.formAddress1.set(existing.location.address1 ?? '');
        this.formAddressVisible.set(existing.location.addressVisible);
      } else if (existing.inPersonLocation) {
        // Legacy free-text location - flag "offer in-person" so the wizard
        // routes through the location/venue steps, but there's no reverse
        // geocoding of a free-text string into country/state/city/address,
        // so those stay blank until the editor re-enters them. Saving
        // replaces the legacy string with a fresh structured `location`.
        this.formOfferInPerson.set(true);
      }
    }
  }

  // ---- Step machine -------------------------------------------------

  readonly currentStepIndex = signal(0);

  readonly stepIds = computed<StepId[]>(() =>
    this.formOfferInPerson()
      ? ['basics', 'format', 'location', 'venue', 'visibility', 'review']
      : ['basics', 'format', 'visibility', 'review'],
  );
  readonly currentStepId = computed<StepId>(() => this.stepIds()[this.currentStepIndex()]);
  readonly stepNumber = computed(() => this.currentStepIndex() + 1);
  readonly stepCount = computed(() => this.stepIds().length);
  readonly progressPercent = computed(() => (this.stepNumber() / this.stepCount()) * 100);

  // Formatted for the Review step - combines the three separate date/time/
  // zone form fields the same way submit() will, so what's shown here is
  // exactly what gets saved.
  readonly reviewStartDateTime = computed(() => {
    const date = this.formStartDate();
    const time = this.formStartTime();
    if (!date || !time) {
      return '';
    }
    return formatGroupDateTime(combineDateTimeInZone(date, time, this.formTimeZone()), this.formTimeZone());
  });

  readonly reviewLocationSummary = computed(() => {
    const parts: string[] = [];
    const showAddress = this.formLocationType() === 'public' || this.formAddressVisible();
    if (showAddress && this.formAddress1().trim()) {
      parts.push(this.formAddress1().trim());
    }
    if (this.formCity().trim()) {
      parts.push(this.formCity().trim());
    }
    if (this.formCountry() === 'US' && this.formState()) {
      parts.push(this.formState());
    }
    return parts.join(', ');
  });

  readonly submitting = signal(false);
  readonly geocoding = signal(false);
  readonly formError = signal<string | undefined>(undefined);

  // ---- Per-step validity ------------------------------------------------

  // Only meaningful when editing (see GroupWizardDialogData.currentApprovedMemberCount's
  // doc comment) - a new group has no members yet, so there's nothing to shrink below.
  readonly maxMembersError = computed(() => {
    const max = this.formMaxMembers();
    const current = this.data.currentApprovedMemberCount;
    if (max === null || current === undefined) {
      return undefined;
    }
    return max < current
      ? current === 1
        ? this.chrome.t("This group already has {n} approved member - group size can't be set below that.", { n: current })
        : this.chrome.t("This group already has {n} approved members - group size can't be set below that.", { n: current })
      : undefined;
  });

  readonly basicsValid = computed(
    () =>
      !!this.formBookId() &&
      this.formTitle().trim().length > 0 &&
      this.formStartDate() !== null &&
      this.formStartTime().trim().length > 0 &&
      !!this.formTimeZone() &&
      !this.maxMembersError(),
  );
  readonly formatValid = computed(() => {
    if (!this.formOfferInPerson() && !this.formOfferOnline()) {
      return false;
    }
    if (this.formOfferOnline() && this.formOnlineInfo().trim().length === 0) {
      return false;
    }
    return true;
  });
  readonly locationValid = computed(() => {
    if (!this.formCountry()) {
      return false;
    }
    if (this.formCountry() === 'US' && !this.formState()) {
      return false;
    }
    return this.formCity().trim().length > 0;
  });
  readonly venueValid = computed(() => this.formAddress1().trim().length > 0);

  readonly currentStepValid = computed(() => {
    switch (this.currentStepId()) {
      case 'basics':
        return this.basicsValid();
      case 'format':
        return this.formatValid();
      case 'location':
        return this.locationValid();
      case 'venue':
        return this.venueValid();
      case 'visibility':
      case 'review':
        return true;
      default:
        return false;
    }
  });

  isFirstStep(): boolean {
    return this.currentStepIndex() === 0;
  }

  isReviewStep(): boolean {
    return this.currentStepId() === 'review';
  }

  next(): void {
    if (!this.currentStepValid()) {
      return;
    }
    if (this.currentStepIndex() < this.stepIds().length - 1) {
      this.currentStepIndex.set(this.currentStepIndex() + 1);
    }
  }

  back(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.set(this.currentStepIndex() - 1);
    }
  }

  cancel(): void {
    if (this.submitting()) {
      return;
    }
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    this.formError.set(undefined);
    this.submitting.set(true);
    try {
      let location: DiscussionGroupLocation | undefined;
      if (this.formOfferInPerson()) {
        this.geocoding.set(true);
        const geocodeResult = await this.geocodingService
          .geocode({
            address1: this.formAddress1().trim(),
            city: this.formCity().trim(),
            state: this.formCountry() === 'US' ? this.formState() : undefined,
            countryCode: this.formCountry(),
          })
          .finally(() => this.geocoding.set(false));

        location = {
          country: this.formCountry(),
          ...(this.formCountry() === 'US' ? { state: this.formState() } : {}),
          city: this.formCity().trim(),
          locationType: this.formLocationType(),
          address1: this.formAddress1().trim(),
          addressVisible: this.formLocationType() === 'public' ? true : this.formAddressVisible(),
          ...(geocodeResult ? { lat: geocodeResult.lat, lng: geocodeResult.lng } : {}),
        };
      }

      const result: GroupWizardResult = {
        bookId: this.formBookId(),
        title: this.formTitle().trim(),
        ...(this.formDescription().trim() ? { description: this.formDescription().trim() } : {}),
        ...(location ? { location } : {}),
        ...(this.formOfferOnline() ? { onlineInfo: this.formOnlineInfo().trim() } : {}),
        startDate: combineDateTimeInZone(this.formStartDate()!, this.formStartTime(), this.formTimeZone()),
        startTimeZone: this.formTimeZone(),
        groupVisibility: this.formGroupVisibility(),
        ...(this.formMaxMembers() ? { maxMembers: this.formMaxMembers()! } : {}),
      };
      this.dialogRef.close(result);
    } catch {
      this.formError.set(this.chrome.t('Something went wrong. Please try again.'));
      this.submitting.set(false);
    }
  }
}
