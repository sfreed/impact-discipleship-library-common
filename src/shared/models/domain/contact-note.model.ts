import { Timestamp } from "firebase/firestore";
import { BaseModel } from "../base.model";

/** One staff note on a contact (customers/{id}.notes[]). The admin writes
 *  these; the web site only ever reads the record they hang off. Until
 *  2026-09-05 the web kept a byte-identical copy named CustomerNoteModel. */
export class ContactNoteModel extends BaseModel{
  date: Timestamp;
  addedBy: string;
  note: string;
  private: boolean;
}
