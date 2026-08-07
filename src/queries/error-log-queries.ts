// Plain-function Firestore reads/writes shared between
// impact-discipleship-library-new and impact-discipleship-library-manager-new
// - see library-queries.ts/discussion-group-queries.ts for why these are
// plain functions rather than an injectable service. Unlike those two files,
// WRITES are included here too: that convention exists because per-app
// business rules differ (a patron's own actions vs. staff moderation), but
// here the write shape is identical in both apps (just "log my own error"),
// so sharing it removes duplication with no downside. See
// errors/base-error-log-handler.ts for the one place that actually calls
// writeErrorLog.

import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  docData,
  collectionData,
  limit,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ErrorLogEntry, NewErrorLogEntry } from '../models/error-log.model';

const COLLECTION = 'errorLogs';

/** Returns the new doc's id - BaseErrorLogHandler keeps it so a repeating
 *  error can update this same entry (updateErrorLogRecurrence below)
 *  instead of flooding the collection. */
export function writeErrorLog(firestore: Firestore, entry: NewErrorLogEntry): Promise<string> {
  return addDoc(collection(firestore, COLLECTION), entry).then((ref) => ref.id);
}

/** The repeat-suppression note on an episode's first entry - the ONLY two
 *  fields firestore.rules lets a client change on an errorLogs doc (own
 *  entries only); everything else stays immutable. */
export function updateErrorLogRecurrence(
  firestore: Firestore,
  entryId: string,
  changes: { repeatCount: number; lastOccurredAt: number },
): Promise<void> {
  return updateDoc(doc(firestore, COLLECTION, entryId), changes);
}

/** Most recent first - backs the manager app's root-only Error Logs screen.
 *  Filtering there is entirely client-side, same as ActivityLogService.
 *  getAllActivity's identical approach. */
export function getAllErrorLogs(firestore: Firestore, max = 500): Observable<ErrorLogEntry[]> {
  return collectionData(query(collection(firestore, COLLECTION), orderBy('timestamp', 'desc'), limit(max)), {
    idField: 'id',
  }) as Observable<ErrorLogEntry[]>;
}

export function getErrorLog(firestore: Firestore, id: string): Observable<ErrorLogEntry | undefined> {
  return docData(doc(firestore, COLLECTION, id), { idField: 'id' }) as Observable<ErrorLogEntry | undefined>;
}

export function deleteErrorLog(firestore: Firestore, id: string): Promise<void> {
  return deleteDoc(doc(firestore, COLLECTION, id));
}

export async function deleteErrorLogs(firestore: Firestore, ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteErrorLog(firestore, id)));
}
