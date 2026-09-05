import { Timestamp } from "firebase/firestore";
import { Role } from "../../lists/roles.enum";
import { Person } from "./utils/person.model";
import { ContactNoteModel } from "./contact-note.model";

// THE type for a `customers` document - the admin's Contacts screens edit
// it and the web site reads it (event schedules resolve a registrant to
// it). Until 2026-09-05 the web carried its own CustomerModel with four of
// these fields and the admin its ContactModel with all of them; the same
// document, two shapes, and nothing to say which was right. The web still
// says "CustomerModel" - its customer.model.ts re-exports this class under
// that name - because the collection is still `customers`; only the admin's
// vocabulary changed to Contacts (2026-08-19).
//
// A customer record is created/kept up to date automatically from two
// sources - the storefront's checkout (functions/src/customer-upsert.
// functions.ts's onPurchaseCustomerUpsert) and event registrations
// (functions/src/event-registration-customer-upsert.functions.ts's
// onEventRegistrationCustomerUpsert) - rather than by an admin typing one
// in. There's no manual "New Customer" flow left in the admin any more. ONE
// sanctioned admin-side exception (2026-08, user-approved): promoting an
// organization's Point of Contact / a form-submission requester into a
// contact via the create-org-contact flow - always admin-reviewed, deduped
// by email (links instead of duplicating), and it never overwrites existing
// profile fields. A purchase's email/name/phone/address (when the order has
// a physical item) or an event registration's email/name gets matched
// against this collection by email and either creates a brand-new record
// or, for an existing one, either updates it directly or - for anything
// that actually differs from what's already on file - queues a
// PendingContactChange instead of silently overwriting real customer data
// from an unverified source.
export interface PendingContactChange {
    field: 'firstName' | 'lastName' | 'phone' | 'shippingAddress' | 'billingAddress';
    currentValue: unknown;
    proposedValue: unknown;
    // Which trigger surfaced this, and the id of that specific purchase/
    // registration doc - not acted on anywhere yet (no "jump to that
    // order/registration" affordance exists), but kept so adding one later
    // doesn't need a data migration.
    source: 'purchase' | 'eventRegistration';
    sourceId: string;
    detectedDate: Timestamp;
}

export class ContactModel extends Person {
    email: string;
    firebaseUID: string;
    role: Role = Role.CUSTOMER;
    notes?: ContactNoteModel[] = [];
    pendingChanges?: PendingContactChange[] = [];
    // Newsletter / Prayer Team subscription state lives HERE as two flag +
    // date pairs (2026-08-15), not in a separate collection. Flipped from
    // outside the admin by functions/src/subscriptions.functions.ts.
    subscribedToNewsletter?: boolean;
    newsletterSubscribedDate?: Timestamp;
    subscribedToPrayerTeam?: boolean;
    prayerTeamSubscribedDate?: Timestamp;
    // Tag ids (Campaign Manager tag rules and manual tagging).
    tags?: string[];
    // The organization this contact belongs to (contacts-manager
    // Organizations > Members), by document id.
    organizationId?: string;
    isBillingSameAsShipping?: boolean;

    constructor(){
      super();
    }
}

export type SubscriptionType = 'newsletter' | 'prayer';

/** The flag + date field pair a subscription type drives - the one place
 *  the admin's Subscribers report and the subscribe/unsubscribe endpoints
 *  agree on which field means which list. */
export function subscriptionFieldsForType(
  type: SubscriptionType
): { flagField: 'subscribedToNewsletter' | 'subscribedToPrayerTeam'; dateField: 'newsletterSubscribedDate' | 'prayerTeamSubscribedDate' } {
  return type === 'prayer'
    ? { flagField: 'subscribedToPrayerTeam', dateField: 'prayerTeamSubscribedDate' }
    : { flagField: 'subscribedToNewsletter', dateField: 'newsletterSubscribedDate' };
}
