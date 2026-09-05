import { BaseModel } from "../../base.model";

// One entry in EventModel.agendaItems[]. A breakout session is an item with
// isCourse: true - since the 2026-08 Courses retirement it is fully
// self-contained: `text` is the breakout's title, `description` its
// description, `coaches` its instructor(s). Registrations reference these
// items directly (EventRegistrationModel.trainingSessions holds agenda-item
// ids, as does eventSessionCounts - verified against prod data), so an
// item's `id` must stay stable once anyone has registered for it.
// "Breakout blocks" are DERIVED, not stored - items sharing an identical
// start/end pair group into a block (see session-block.util.ts).
export class AgendaItem extends BaseModel{
  // For a breakout (isCourse) item: the breakout's display title. For plain
  // agenda items: the free-text line shown on the schedule.
  text: string;
  // Optional in truth: the admin's agenda dialog never sets it on a new item
  // (only `text`), and copy-from-last-summit writes '' when it is absent.
  name?: string;
  startDate: Date;
  endDate: Date;
  // LEGACY (frozen): pre-retirement link to a courses/{id} doc that held
  // the title/description. Never written by new saves; kept as provenance
  // and as the fallback key for the web's "same session at another time"
  // conflict check on old items. scripts/flatten-courses-onto-agenda-items.js
  // copied course title/description onto `text`/`description`. `null` is
  // what the admin's agenda dialog writes when it clears it (Firestore
  // rejects `undefined`), so the type says so.
  course?: string | null;
  // Instructor id(s) - each may live in `coaches` OR `impact_team` (see the
  // merged picker in event-agenda.component.ts). Source of truth for who
  // leads this item; CourseModel.coachIds never made it into real data and
  // is gone with the Courses retirement.
  // `null` on the four below is what the admin's agenda dialog writes for a
  // field that does not apply to the item's type (a food break has no
  // coaches, a plain item no capacity) - Firestore rejects `undefined`, so
  // the stored shape really is null and the type says so (2026-09-05).
  coaches?: string[] | null;
  isCourse?: boolean;
  isBreakout?: boolean;
  isFoodBreak?: boolean;
  maxParticipants?: number | null;
  signedUp?: number;
  description?: string | null;
  room?: string | null;
  // Ordered waiting queue for a FULL breakout item - emails, lowercase,
  // append-at-tail (position IS the fairness guarantee). Written only by the
  // admin app (Summit Command Center's Promote action: EventService
  // .addToWaitList/removeFromWaitList); the public site reads the shape but
  // no longer offers a self-service wait-list prompt (the old one never
  // persisted; removed 2026-08-20).
  waitList?: string[];
}
