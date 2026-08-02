import { Component, Inject, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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

export interface GroupWizardBook {
  id: string;
  title: string;
}

export interface GroupWizardDialogData {
  books: GroupWizardBook[];
  /** Present only when editing an existing group - every field is
   *  pre-filled from it. Absent means "create a new group". */
  existingGroup?: DiscussionGroup;
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
  groupVisibility: 'public' | 'invite-only';
}

type StepId = 'basics' | 'format' | 'location' | 'venue' | 'visibility' | 'review';

@Component({
  selector: 'common-group-wizard-dialog',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
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

  readonly countries = COUNTRIES;
  readonly usStates = US_STATES;

  readonly isEditMode: boolean;

  // ---- Form state -----------------------------------------------------

  readonly formBookId = signal('');
  readonly formTitle = signal('');
  readonly formDescription = signal('');
  readonly formStartDate = signal<Date | null>(null);

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
    const existing = data.existingGroup;
    if (existing) {
      this.formBookId.set(existing.bookId);
      this.formTitle.set(existing.title);
      this.formDescription.set(existing.description ?? '');
      this.formStartDate.set(new Date(existing.startDate));
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

  readonly basicsValid = computed(
    () => !!this.formBookId() && this.formTitle().trim().length > 0 && this.formStartDate() !== null,
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
        startDate: this.formStartDate()!.getTime(),
        groupVisibility: this.formGroupVisibility(),
      };
      this.dialogRef.close(result);
    } catch {
      this.formError.set('Something went wrong. Please try again.');
      this.submitting.set(false);
    }
  }
}
