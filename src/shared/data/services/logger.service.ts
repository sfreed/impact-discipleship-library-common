import { Injectable } from "@angular/core";
import { Timestamp } from "firebase/firestore";
import { Observable, catchError, from, map, of } from "rxjs";
import { randomHexId } from '../../utils/random-hex-id';
import { LogMessage } from "../../models/utils/log-message.model";
import { dateFromTimestamp } from "../../utils/date-from-timestamp";
import { FirebaseDAO } from '../firebase.dao';
import { BaseService } from "../base.service";

@Injectable({
  providedIn: "root",
})
export class LoggerService extends BaseService<LogMessage> {
  constructor(public override dao: FirebaseDAO<LogMessage>) {
    super(dao)
    this.table="log-messages"
    this.fromFirestore = LoggerService.fromFirestore
  }

  static readonly fromFirestore = (data: LogMessage): LogMessage => {
    data.date = dateFromTimestamp(data.date as Timestamp)

    return data;
  };

  // A log line is best-effort and must NEVER break its caller: it resolves
  // with the error code either way. create() writes without wanting the
  // document back (a visitor may write log-messages but not read them), and
  // catchError keeps the promise the signature makes - the admin's copy of
  // this service left a login screen spinning on 2026-09-04 by doing
  // neither.
  logMessage(type: string, created_by: string, message: string, data?: unknown): Observable<string | boolean> {
    try {
      const ec = randomHexId(8);
      const logMessage: LogMessage = { ...new LogMessage(type, created_by, message, ec, LoggerService.sanitizeData(data)) };
      logMessage.id = randomHexId(8);

      return from(this.create(logMessage)).pipe(
        map(() => ec),
        catchError((err) => {
          console.error('Could not write a log message', err);
          return of(ec);
        })
      );
    } catch (err) {
      console.error(err);

      return of(true);
    }
  }

  // Firestore rejects custom class instances (Error, FirebaseError) and
  // undefined values inside addDoc payloads -- and several call sites pass
  // a caught error straight in as { err }. Reduce everything to plain
  // JSON-safe values so logging an error can never itself throw.
  private static sanitizeData(data: unknown): unknown {
    if (data === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(data, (_key, value) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack ?? null };
        }
        return value === undefined ? null : value;
      }));
    } catch {
      return { unserializable: String(data) };
    }
  }
}
