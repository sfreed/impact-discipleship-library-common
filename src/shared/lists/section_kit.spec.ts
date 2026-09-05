import {
  ArchetypeDef,
  CONTENT_PIECES,
  ContentPieceKindKey,
  DEFAULT_PAGE_THEME,
  SECTION_ARCHETYPE,
  SECTION_KIT,
  SECTION_SURFACES,
  SIGNUP_LISTS,
  contentPieceDef,
  resolveSurface
} from './section_kit';

// WHAT THIS FILE USED TO BE, AND WHY IT IS A TENTH OF THE SIZE.
//
// It was 1,043 lines, and about nine hundred of them tested the MIGRATION:
// LEGACY_RENDERINGS (a hand-written map from each original page's sections to
// an archetype), toKitBlocks (draw an old page through the kit for the
// comparison screen) and toSectionModel (turn a fourteen-archetype block into
// a Section carrying pieces). Those assertions were the reason the cutover of
// fourteen pages went the way it did, and several of them went red honestly
// while it was running.
//
// All three are deleted, because everything they moved has moved. Every page
// in the dev data is a Section or a List, so there is no old shape left to
// map from and nothing to compare against. Tests for deleted code are worse
// than no tests: they pass forever and describe a thing that is not there.
//
// What remains is what the kit still IS - two members, their looks, the
// pieces a column can hold, and the ground a section is drawn on.

describe('the section kit', () => {
  it('declares exactly the two members, and nothing else', () => {
    // This number went 16 -> 2 on 2026-09-01, at the end of a refactor whose
    // whole point was that fourteen archetypes were fourteen arrangements of
    // the same two ideas: columns of content, and one shape repeated.
    //
    // It is a real assertion, not a tally. A THIRD member is how this starts
    // growing back, and it should have to be argued for here first.
    expect(SECTION_KIT.length).toBe(2);
    expect(SECTION_KIT.map((def) => def.archetype))
      .toEqual([SECTION_ARCHETYPE.SECTION, SECTION_ARCHETYPE.LIST]);
  });

  it('covers every member of the archetype enum', () => {
    // An enum member with no definition is a type the editor offers and
    // nothing can draw. Cheap now that there are two; it is the direction
    // that matters, and it is the one a new archetype breaks.
    const defined = new Set(SECTION_KIT.map((def) => def.archetype));
    const missing = Object.values(SECTION_ARCHETYPE).filter((a) => !defined.has(a));

    expect(missing).toEqual([]);
  });

  it('gives every archetype at least one variant, and a label for each', () => {
    const problems: string[] = [];
    for (const def of SECTION_KIT) {
      if (!def.variants.length) {
        problems.push(`${def.archetype} has no variants`);
      }
      if (!def.label?.trim() || !def.blurb?.trim() || !def.icon?.trim()) {
        problems.push(`${def.archetype} is missing a label, blurb or icon`);
      }
      for (const variant of def.variants) {
        if (!variant.key?.trim() || !variant.label?.trim() || !variant.blurb?.trim()) {
          problems.push(`${def.archetype}/${variant.key} is missing a key, label or blurb`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('keeps variant keys unique within an archetype', () => {
    // The lookup takes the first match, so a duplicate makes the second
    // unreachable - including its fields, which is how a section ends up
    // editable in a way it cannot render.
    const dupes = SECTION_KIT
      .filter((def) => new Set(def.variants.map((v) => v.key)).size !== def.variants.length)
      .map((def) => def.archetype);

    expect(dupes).toEqual([]);
  });

  it('gives a Section ONE variant - how many columns it has is not a look', () => {
    // The count of columns is the LENGTH of `columns`. A variant saying it
    // too is a second source of truth, and the two disagree the first time
    // somebody drags a column out.
    const section = SECTION_KIT.find((def) => def.archetype === SECTION_ARCHETYPE.SECTION);

    expect(section?.variants.length).toBe(1);
    expect(section?.variants[0].key).toBe('columns');
  });

  it('keeps every look the six repeaters had, under the names they migrated to', () => {
    // These ten keys are STORED on the migrated pages - the cutover wrote
    // them on 2026-08-31. Renaming one here does not rename it in Firestore;
    // it makes every section carrying the old name draw nothing, silently,
    // because the renderer's @switch simply finds no case. That is why each
    // one is named rather than counted.
    //
    // It was an exact toEqual until 2026-09-04, which also failed the first
    // time a NEW look was added ('quoteCards'). Adding one threatens nothing
    // this test protects - only renaming or removing one does - and a guard
    // that cries about safe changes gets edited without being read. So the
    // ten are asserted individually and the list may grow past them.
    const list = SECTION_KIT.find((def) => def.archetype === SECTION_ARCHETYPE.LIST);
    const keys = list?.variants.map((v) => v.key) ?? [];

    for (const migrated of [
      'tiles', 'pictureRows', 'icon', 'price', 'rows',
      'articles', 'numbered', 'timeline', 'quotes', 'slides'
    ]) {
      expect(keys)
        .withContext(
          `"${migrated}" is stored on live pages - without it here, every ` +
          'section carrying that name draws nothing and says nothing'
        )
        .toContain(migrated);
    }
  });

  it('gives every List look somewhere to get its items from', () => {
    // A look with neither is an editor with nothing to add to, drawing an
    // empty band. There are two honest answers: the section's own entries,
    // or the testimonials collection - the quote carousel is the second,
    // because the same quote appears on more than one page and its words
    // belong to the Testimonials screen, not to a private copy here.
    const list = SECTION_KIT.find((def) => def.archetype === SECTION_ARCHETYPE.LIST);
    const sourceless = (list?.variants ?? [])
      .filter((v) => !v.fields.entries && !v.fields.testimonials)
      .map((v) => v.key);

    expect(sourceless).toEqual([]);
  });

  it('names only real surfaces where a look restricts them', () => {
    const known = new Set(SECTION_SURFACES.map((s) => s.key));
    const unknown: string[] = [];
    for (const def of SECTION_KIT as readonly ArchetypeDef[]) {
      for (const variant of def.variants) {
        for (const surface of variant.surfaces ?? []) {
          if (!known.has(surface)) {
            unknown.push(`${def.archetype}/${variant.key}: ${surface}`);
          }
        }
      }
    }

    expect(unknown).toEqual([]);
  });
});

describe('the pieces a column can hold', () => {
  it('defines every kind exactly once, with something to show in the palette', () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const piece of CONTENT_PIECES) {
      if (seen.has(piece.kind)) {
        problems.push(`${piece.kind} is defined twice`);
      }
      seen.add(piece.kind);
      if (!piece.label?.trim() || !piece.blurb?.trim() || !piece.icon?.trim()) {
        problems.push(`${piece.kind} is missing a label, blurb or icon`);
      }
    }

    expect(problems).toEqual([]);
  });

  it('declares at least one field per kind - except the ones that read elsewhere', () => {
    // A piece with no fields is a palette entry that opens an empty editor.
    // The exceptions are real: Site details draws entirely from Web Config, a
    // Note is drawn from the block's own note line, and the reader map draws
    // entirely from `library_map/points` - a document a Cloud Function
    // derives from libraryUsers, which no staff member can type into and no
    // public client may read. All three are content that exists elsewhere,
    // which is the point of them.
    const readsElsewhere: ContentPieceKindKey[] = [
      'siteDetails', 'note', 'readerMap'
    ];
    const empty = CONTENT_PIECES
      .filter((piece) => !readsElsewhere.includes(piece.kind))
      .filter((piece) => Object.values(piece.fields).every((on) => !on))
      .map((piece) => piece.kind);

    expect(empty).toEqual([]);
  });

  it('finds a piece by kind, and returns nothing rather than a guess', () => {
    expect(contentPieceDef('heading')?.label).toBe('Heading');
    expect(contentPieceDef('notAPiece')).toBeUndefined();
    expect(contentPieceDef(undefined)).toBeUndefined();
  });

  it('keeps a form and a sign-up the different things they are', () => {
    // They shared one archetype variant until the split, and conflating them
    // again would put a Form Builder picker on the three-field newsletter
    // box - or worse, silently subscribe a consultation request to a list.
    const form = contentPieceDef('form');
    const signup = contentPieceDef('signup');

    expect(form?.fields.form).withContext('a form picks a built form').toBeTrue();
    expect(form?.fields.signupList).withContext('a form joins no list').toBeFalsy();
    expect(signup?.fields.signupList).withContext('a sign-up names a list').toBeTrue();
    expect(signup?.fields.form).withContext('a sign-up picks no built form').toBeFalsy();
  });

  it('offers only lists that exist, and defaults to neither by omission', () => {
    // 'prayer' is a commitment somebody chooses; 'newsletter' is what "sign
    // up" plainly means. The renderer defaults an unset list to the
    // newsletter - see kit-section.component.spec - and these are the only
    // two values that default can be chosen from.
    expect(SIGNUP_LISTS.map((l) => l.key)).toEqual(['newsletter', 'prayer']);
    expect(SIGNUP_LISTS.every((l) => !!l.label?.trim())).toBeTrue();
  });
});

describe('resolving the ground a section sits on', () => {
  it('takes the page theme when the section says inherit', () => {
    expect(resolveSurface('inherit', { surface: 'dark' })).toBe('dark');
    expect(resolveSurface(undefined, { surface: 'tinted' })).toBe('tinted');
  });

  it('lets a section override its page', () => {
    // About Us runs a dark history band between light story columns, which
    // is the whole reason a section can override at all.
    expect(resolveSurface('dark', { surface: 'light' })).toBe('dark');
  });

  it('falls back to the default theme when a page has none', () => {
    expect(resolveSurface(undefined)).toBe(DEFAULT_PAGE_THEME.surface);
    expect(DEFAULT_PAGE_THEME.surface).toBe('light');
  });
});
