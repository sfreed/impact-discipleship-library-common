/**
 * WHERE THE DISCIPLESHIP LIBRARY IS BEING READ, as a public page may see it.
 *
 * One document, `library_map/points`, derived from `libraryUsers` by a Cloud
 * Function and readable by anyone.
 *
 * THE WHOLE POINT OF THIS TYPE IS WHAT IT DOES NOT CARRY. `libraryUsers` is
 * readable only by its owner or an admin, and each document holds an email
 * address, a phone number, a name, book licences and a last-login time. The
 * Library tab's own map reads that collection directly and names each person
 * in a popup, which is correct behind a staff login and unpublishable
 * anywhere else.
 *
 * So the derived document holds coordinates and a total. No name, no email,
 * no id, no city or country, and no per-place count - a coordinate on its own
 * identifies nobody, and there is nothing here to join back to a person even
 * for someone reading the document directly. Anything richer than this
 * belongs behind the admin's own auth, not in a collection whose read rule is
 * `if true`.
 *
 * Adding a field to this interface is therefore a privacy decision, not a
 * modelling one.
 */
export interface LibraryMapPoint {
  /** Degrees north, already jittered - see LibraryMapModel.points. */
  lat: number;
  /** Degrees east, already jittered. */
  lng: number;
}

export interface LibraryMapModel {
  /**
   * One point per reader whose location is known, in no meaningful order.
   *
   * JITTERED, and for two reasons. IP geolocation resolves to a city
   * centroid, so every reader in one city would otherwise share an identical
   * coordinate and twenty of them would draw as one dot - the map would
   * under-report itself badly (today: 29 readers, 15 distinct places). A
   * small offset, seeded from the user's own id so a dot does not wander
   * between recomputes, separates them. It also means the published
   * coordinate is not the geolocated one, which is a fair thing to be true of
   * a public file.
   */
  points: LibraryMapPoint[];
  /** How many readers are plotted. The same as points.length, stored so a
   *  caller can show a figure without reading the array. */
  total: number;
  /** When the function last rebuilt this, as epoch milliseconds. */
  updatedAt: number;
}
