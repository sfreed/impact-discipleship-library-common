import {
  ArchetypeDef,
  DEFAULT_PAGE_THEME,
  LEGACY_RENDERINGS,
  SECTION_ARCHETYPE,
  SECTION_KIT,
  SECTION_SURFACES,
  archetypeDef,
  kitFields,
  resolveSurface,
  toKitBlocks,
  variantDef
,
  toSectionModel, toSectionBlocks
} from './section_kit';

// The kit claims it can draw every page the site has. Nothing type-checks
// that claim - LEGACY_RENDERINGS is hand-written from a read of the nine
// section components - so these are the assertions that would otherwise be a
// public page quietly losing a band.
//
// A NOTE ON WHAT THESE CAN AND CANNOT CATCH. They prove the kit is internally
// consistent and that it names a home for every section on the site. They do
// NOT prove a section LOOKS the same once moved; only a rendered comparison
// does that, and it belongs in the web repo beside the renderers. Do not read
// a green run here as permission to delete a bespoke component.

describe('the section kit', () => {
  it('declares sixteen archetypes - fourteen retiring, two replacing them', () => {
    // FOURTEEN came from the census of the twelve public pages. SLIDER and
    // COUNTDOWN came later (2026-08-31) from the home page, which was never
    // in that census: both were behaviour rather than layout and would
    // otherwise have stayed bespoke components forever. HERO_SPLIT left the
    // same day, folded into HERO_BAND as a second look - it was the same
    // thing in a different layout, which is what a variant is for.
    // SIXTEEN is a transitional number and should shrink to TWO. The
    // fourteen census archetypes are on their way out; SECTION and LIST
    // replace them, and both shapes have to render while pages migrate one
    // at a time. If this is still 16 long after the migration finished,
    // Stage 4 was never done.
    expect(SECTION_KIT.length).toBe(16);
    expect(new Set(SECTION_KIT.map((d) => d.archetype)).size).toBe(16);
  });

  it('covers every member of the archetype enum', () => {
    // An enum member with no definition is a type the editor offers and
    // nothing can draw.
    const defined = new Set(SECTION_KIT.map((d) => d.archetype));
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
    // variantDef() takes the first match, so a duplicate makes the second
    // unreachable - including its fields, which is how a section ends up
    // editable in a way it cannot render.
    const dupes = SECTION_KIT
      .filter((def) => new Set(def.variants.map((v) => v.key)).size !== def.variants.length)
      .map((def) => def.archetype);

    expect(dupes).toEqual([]);
  });

  // The unused-variant check retired with the last LEGACY row (2026-08-31):
  // every variant graduated onto the migrated pages themselves.
});

describe('coverage of the site as it stands', () => {
  it('maps one row per section the catalogue declares', () => {
    // 49 is the admin catalogue's own count of declared kinds. The admin
    // repo's spec pins the two lists together row by row; this is the cheap
    // version that fails first if a row is dropped while editing here.
    // ZERO: all twelve pages have cut over (2026-08-31). The map stays as
    // the refusal list - see the re-flip test below.
    expect(LEGACY_RENDERINGS.length).toBe(0);
  });

  it('covers every page still awaiting cutover', () => {
    expect(new Set(LEGACY_RENDERINGS.map((r) => r.page)).size).toBe(0);
  });

  it('resolves every rendering to a real archetype and variant', () => {
    // THE ASSERTION THIS FILE EXISTS FOR. A row that does not resolve is a
    // section on the live site the kit cannot express.
    const orphans: string[] = [];
    for (const rendering of LEGACY_RENDERINGS) {
      if (!archetypeDef(rendering.archetype)) {
        orphans.push(`${rendering.page}/${rendering.type}: no archetype "${rendering.archetype}"`);
        continue;
      }
      if (!variantDef(rendering.archetype, rendering.variant)) {
        orphans.push(`${rendering.page}/${rendering.type}: no variant "${rendering.variant}"`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it('never names a surface that is not a real one', () => {
    const known = new Set(SECTION_SURFACES.map((s) => s.key));
    const bad = LEGACY_RENDERINGS
      .filter((r) => !known.has(r.surface))
      .map((r) => `${r.page}/${r.type}: ${r.surface}`);

    expect(bad).toEqual([]);
  });

  it('never puts two of a SINGLETON archetype on one page', () => {
    // A second hero puts two titles above the fold. Two timelines each draw
    // their own centre line.
    const counts = new Map<string, number>();
    for (const rendering of LEGACY_RENDERINGS) {
      const key = `${rendering.page}/${rendering.archetype}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const doubled: string[] = [];
    for (const [key, n] of counts) {
      const archetype = key.split('/')[1];
      if (n > 1 && archetypeDef(archetype)?.singleton) {
        doubled.push(`${key} appears ${n} times`);
      }
    }

    expect(doubled).toEqual([]);
  });


  it('means the same thing by any name the two vocabularies share', () => {
    // PAGE_SECTION_TYPES and SECTION_ARCHETYPE overlap on 'timeline' and
    // 'form'. That is a FEATURE - a block already storing the value the kit
    // wants needs no migration - but only while the two agree about what it
    // draws. If 'form' ever became a different section in the kit than it is
    // on the twelve pages, every existing form block would quietly render as
    // the wrong thing, with the stored data unchanged and nothing to point
    // at. So: a shared name must map to itself.
    const archetypes = new Set<string>(Object.values(SECTION_ARCHETYPE));
    const wrong = LEGACY_RENDERINGS
      .filter((r) => archetypes.has(r.type) && r.archetype !== (r.type as string))
      .map((r) => `${r.page}/${r.type} -> ${r.archetype}`);

    expect(wrong)
      .withContext(
        'These blocks store a value that is ALSO an archetype name, but the kit maps them '
        + 'somewhere else - so the same stored string would mean two different sections.')
      .toEqual([]);
  });

});

describe('fields a variant offers', () => {
  it('gives BOTH hero looks a list of buttons and a note line', () => {
    // The hero's two FIXED button slots went away on 2026-08-31, and the
    // separate HERO_SPLIT archetype went with them: it was the same thing -
    // the page's <h1>, one per page - in a different layout, which is what a
    // variant is for. Existing sections were migrated by
    // scripts/merge-hero-split.js and cta-buttons-to-entries.js.
    for (const look of ['overPhoto', 'besidePicture']) {
      expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, look).entries)
        .withContext(look).toBeTrue();
      expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, look).note)
        .withContext(look).toBeTrue();
      expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, look).cta2)
        .withContext(look).toBeUndefined();
    }
  });

  it('falls back to the first variant when a block names none', () => {
    // A block written before variants existed, or one whose variant was
    // removed, draws the archetype's default rather than nothing.
    expect(variantDef(SECTION_ARCHETYPE.COPY_MEDIA, undefined)?.key).toBe('video');
  });

  it('returns nothing for an unknown archetype or variant, rather than a guess', () => {
    // A stale stored variant has to surface as a problem. Rendering
    // something plausible instead is how a page quietly becomes wrong.
    expect(variantDef('notAnArchetype', 'standard')).toBeUndefined();
    expect(variantDef(SECTION_ARCHETYPE.COPY_MEDIA, 'notAVariant')).toBeUndefined();
    expect(kitFields('notAnArchetype', undefined)).toEqual({});
  });

  it('declares entries exactly where a variant is a list', () => {
    // A list variant with no `entries` opens an editor with nothing to add
    // to; a non-list variant with `entries` shows a list nothing draws.
    // A section's entries are one of two things, and every variant that
    // declares them must be one or the other (2026-08-31):
    //
    //   CONTENT - the tiles, rows, slides or passages the section IS.
    //   BUTTONS - on a section that is not a list but has buttons. They were
    //             one or two fixed slots until the owner asked for "as many
    //             as they want"; a list is what that means.
    const listArchetypes: string[] = [
      SECTION_ARCHETYPE.LIST_ROWS, SECTION_ARCHETYPE.LIST_GRID,
      SECTION_ARCHETYPE.LIST_ARTICLES, SECTION_ARCHETYPE.LIST_COLUMNS,
      SECTION_ARCHETYPE.TIMELINE,
      // A slider is a list of SLIDES - the rotation is the renderer's, the
      // slides are entries like any other.
      SECTION_ARCHETYPE.SLIDER,
      // A carousel repeats one shape per item too - it just sources the
      // list from the testimonials collection instead of its own entries.
      SECTION_ARCHETYPE.CAROUSEL,
      // The one that replaces all six of them (2026-08-31).
      SECTION_ARCHETYPE.LIST
    ];
    const buttonBearing: string[] = [
      SECTION_ARCHETYPE.HERO_BAND,
      SECTION_ARCHETYPE.COPY_MEDIA, SECTION_ARCHETYPE.COPY_CENTRED,
      SECTION_ARCHETYPE.COUNTDOWN,
      // Gained buttons when the consultation banner became an ordinary
      // section rather than an archetype of its own (2026-08-31).
      SECTION_ARCHETYPE.PHOTO_BAND
    ];

    const mismatched: string[] = [];
    for (const def of SECTION_KIT as readonly ArchetypeDef[]) {
      for (const variant of def.variants) {
        const exception = buttonBearing.includes(def.archetype);
        const shouldHave = listArchetypes.includes(def.archetype) || exception;
        // A list variant has to say where its items COME FROM, and there are
        // two honest answers: its own entries, or the testimonials
        // collection. The quote carousel is the second - the quotes belong to
        // the Testimonials screen because the same quote can appear on more
        // than one page, and the section stores only the order. Demanding
        // `entries` of it would be demanding a second, private copy of
        // somebody else's data.
        const hasItems = !!variant.fields.entries || !!variant.fields.testimonials;
        if (shouldHave !== hasItems) {
          mismatched.push(`${def.archetype}/${variant.key}`);
        }
      }
    }

    expect(mismatched).toEqual([]);
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

describe('flipping an original page onto the kit', () => {
  // toKitBlocks is shared by the /kit-preview route and the eventual
  // migration - the reason approving a side-by-side means anything. These
  // pin the flip itself.

  it('rests on (page, oldType) being unique - the flip is ambiguous otherwise', () => {
    const pairs = LEGACY_RENDERINGS.map((r) => `${r.page}/${r.type}`);
    const dupes = pairs.filter((p, i) => pairs.indexOf(p) !== i);
    expect(dupes).toEqual([]);
  });

  it('reports EVERY page as unmapped - a re-flip of migrated data must refuse', () => {
    for (const page of ['lunch-and-learns', 'seminars', 'coaching-with-impact']) {
      const { problems } = toKitBlocks(page, [{ key: 'k', type: 'pageHeader' }]);
      expect(problems.length).withContext(page).toBe(1);
    }
  });

  // The extras tests (form ids, prayer list, text styles) retired with the
  // cutovers that moved those values INTO the documents.


  it('reports a section it cannot map instead of quietly shortening the page', () => {
    const { blocks, problems } = toKitBlocks('lunch-and-learns', [
      { key: 'mystery', type: 'giveOptions' }
    ]);

    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('mystery');
    // The old type is kept, not guessed - the preview page SHOWS the problem.
    expect(blocks[0]['type']).toBe('giveOptions');
  });

  it('never mutates the caller blocks - the preview runs on the LIVE document', () => {
    const original = [{ key: 'hero', type: 'pageHeader' }];
    toKitBlocks('lunch-and-learns', original);

    expect(original[0].type).toBe('pageHeader');
    expect('variant' in original[0]).toBeFalse();
  });
});

/**
 * THE FLIP FROM FOURTEEN ARCHETYPES TO TWO.
 *
 * This function IS the migration - the comparison screen runs it in memory
 * and the cutover script runs it to write, so an approved preview cannot
 * migrate into something else. It is the same contract toKitBlocks carried
 * through the first cutover.
 *
 * What these specs are actually protecting: a section that flips into
 * something the renderer cannot draw does not throw - it draws NOTHING, and
 * a page that is quietly one band shorter is exactly how a migration loses a
 * piece of the site.
 */
describe('flipping a section into the two new members', () => {
  it('turns every repeater into a List, changing nothing else', () => {
    const grid = {
      key: 'ebooks', type: SECTION_ARCHETYPE.LIST_GRID, variant: 'picture',
      heading: 'E-books', surface: 'light',
      items: [{ title: 'One', isActive: true }, { title: 'Two', isActive: true }]
    };

    const out = toSectionModel(grid);

    expect(out['type']).toBe(SECTION_ARCHETYPE.LIST);
    expect(out['variant']).toBe('tiles');
    // A RENAME. The entries are the whole value of a list and nothing here
    // reshapes them - if this ever stops being true, the migration has
    // started rewriting content rather than moving it.
    expect(out['items']).toEqual(grid.items);
    expect(out['heading']).toBe('E-books');
    expect(out['surface']).toBe('light');
  });

  it('maps every repeater look the old archetypes had', () => {
    const repeaters: [SECTION_ARCHETYPE, string, string][] = [
      [SECTION_ARCHETYPE.LIST_GRID, 'picture', 'tiles'],
      [SECTION_ARCHETYPE.LIST_GRID, 'pictureRows', 'pictureRows'],
      [SECTION_ARCHETYPE.LIST_GRID, 'icon', 'icon'],
      [SECTION_ARCHETYPE.LIST_GRID, 'price', 'price'],
      [SECTION_ARCHETYPE.LIST_ROWS, 'buttonAndText', 'rows'],
      [SECTION_ARCHETYPE.LIST_ARTICLES, 'plain', 'articles'],
      [SECTION_ARCHETYPE.LIST_ARTICLES, 'numbered', 'numbered'],
      [SECTION_ARCHETYPE.TIMELINE, 'centreLine', 'timeline'],
      [SECTION_ARCHETYPE.CAROUSEL, 'quotes', 'quotes'],
      [SECTION_ARCHETYPE.SLIDER, 'slides', 'slides']
    ];

    const wrong = repeaters.filter(([type, variant, look]) =>
      toSectionModel({ key: 'k', type, variant })['variant'] !== look);

    expect(wrong.map(([t, v]) => `${t}/${v}`))
      .withContext('these looks flip to the wrong List variant')
      .toEqual([]);
  });

  it('turns a hero into a Section whose heading is the PAGE title', () => {
    // The one heading a search engine reads as the page's name. It used to
    // be guaranteed by the hero archetype being one per page; it is explicit
    // now, and this is where that promise is kept.
    const out = toSectionModel({
      key: 'pageHeader', type: SECTION_ARCHETYPE.HERO_BAND, variant: 'overPhoto',
      surface: 'photo', heading: 'Seminars', subheading: 'EQUIPPING',
      body: '<p>Copy.</p>', ctaTitle: 'Register', ctaUrl: '/events'
    });

    expect(out['type']).toBe(SECTION_ARCHETYPE.SECTION);
    const pieces = (out['columns'] as Record<string, unknown>[])[0]['pieces'] as Record<string, unknown>[];
    const heading = pieces.find((p) => p['kind'] === 'heading');

    expect(heading?.['text']).toBe('Seminars');
    expect(heading?.['level']).toBe('page');
    // In the order the old renderer drew them.
    expect(pieces.map((p) => p['kind'])).toEqual(['eyebrow', 'heading', 'text', 'buttons']);
  });

  it('carries the legacy button pair across as real buttons', () => {
    const out = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.COPY_CENTRED, heading: 'Give',
      ctaTitle: 'One gift', ctaUrl: 'one', ctaTitle2: 'Monthly', ctaUrl2: 'monthly'
    });

    const pieces = (out['columns'] as Record<string, unknown>[])[0]['pieces'] as Record<string, unknown>[];
    const buttons = pieces.find((p) => p['kind'] === 'buttons')?.['buttons'] as Record<string, unknown>[];

    expect(buttons.map((b) => b['title'])).toEqual(['One gift', 'Monthly']);
    // KEYS, not addresses - the whole reason giving destinations are named.
    expect(buttons.map((b) => b['link'])).toEqual(['one', 'monthly']);
  });

  it('puts the picture on the side the section says, not always the right', () => {
    const right = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.COPY_MEDIA, heading: 'A', body: '<p>b</p>',
      image: { url: 'https://example.test/p.jpg' }
    });
    const left = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.COPY_MEDIA, heading: 'A', body: '<p>b</p>',
      image: { url: 'https://example.test/p.jpg' }, mediaSide: 'left'
    });

    const firstKind = (out: Record<string, unknown>) => {
      const cols = out['columns'] as Record<string, unknown>[];
      return ((cols[0]['pieces'] as Record<string, unknown>[])[0])['kind'];
    };

    expect(firstKind(right)).toBe('heading');
    expect(firstKind(left)).toBe('picture');
  });

  it('gives a two-column block a FULL-WIDTH heading over its columns', () => {
    // Nearly every two-column band on the site has one. Expressing it as a
    // spanning column keeps the single rule - a section is columns of pieces
    // - instead of reintroducing a heading field that only works at the top.
    const out = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.LIST_COLUMNS, heading: 'Who it is for',
      leftGround: 'panel', rightGround: 'panel',
      items: [
        { title: 'Leaders', body: '<p>x</p>', column: 'left', isActive: true },
        { title: 'Teams', body: '<p>y</p>', column: 'right', isActive: true }
      ]
    });

    const columns = out['columns'] as Record<string, unknown>[];
    expect(columns[0]['full']).toBe(true);
    expect(columns.length).toBe(3);
    // The ground each side carried survives as the column's own.
    expect(columns[1]['ground']).toBe('panel');
    expect(columns[2]['ground']).toBe('panel');
  });

  it('keeps a form and a sign-up as the different things they are', () => {
    const form = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.FORM, variant: 'plain', formId: 'abc'
    });
    const signup = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.FORM, variant: 'mailingList', signupList: 'prayer'
    });

    const kinds = (out: Record<string, unknown>) =>
      ((out['columns'] as Record<string, unknown>[])[0]['pieces'] as Record<string, unknown>[])
        .map((p) => p['kind']);

    expect(kinds(form)).toContain('form');
    expect(kinds(signup)).toContain('signup');
    // Never defaulted to the prayer team by accident.
    const piece = ((signup['columns'] as Record<string, unknown>[])[0]['pieces'] as Record<string, unknown>[])
      .find((p) => p['kind'] === 'signup');
    expect(piece?.['signupList']).toBe('prayer');
  });

  it('drops the fields that became pieces, so nothing is stored twice', () => {
    // Two copies of a heading is two sources of truth, and the one the
    // renderer ignores is the one somebody will edit.
    const out = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.COPY_CENTRED,
      heading: 'A', body: '<p>b</p>', ctaTitle: 'Go', ctaUrl: '/x'
    });

    for (const field of ['heading', 'body', 'ctaTitle', 'ctaUrl']) {
      expect(out[field]).withContext(`${field} was left on the block`).toBeUndefined();
    }
  });

  it('keeps the levers that are still the section’s own', () => {
    const out = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.COPY_CENTRED, heading: 'A',
      surface: 'tinted', headingStyle: 'light', copySize: 'large', pairWithNext: true
    });

    expect(out['surface']).toBe('tinted');
    expect(out['headingStyle']).toBe('light');
    expect(out['copySize']).toBe('large');
    expect(out['pairWithNext']).toBe(true);
  });

  it('makes no empty pieces out of empty fields', () => {
    // An empty piece is one staff have to notice and delete, on every
    // section, forever.
    const out = toSectionModel({ key: 'k', type: SECTION_ARCHETYPE.COPY_CENTRED, heading: 'A' });
    const pieces = (out['columns'] as Record<string, unknown>[])[0]['pieces'] as Record<string, unknown>[];

    expect(pieces.map((p) => p['kind'])).toEqual(['heading']);
  });

  it('gives every piece in a section a key nothing else there uses', () => {
    const out = toSectionModel({
      key: 'k', type: SECTION_ARCHETYPE.LIST_COLUMNS, heading: 'H',
      items: [
        { title: 'A', body: '<p>a</p>', column: 'left', isActive: true },
        { title: 'B', body: '<p>b</p>', column: 'left', isActive: true },
        { title: 'C', body: '<p>c</p>', column: 'right', isActive: true }
      ]
    });

    const columns = out['columns'] as Record<string, unknown>[];
    const keys = columns.flatMap((c) => [
      c['key'] as string,
      ...(c['pieces'] as Record<string, unknown>[]).map((p) => p['key'] as string)
    ]);

    expect(new Set(keys).size)
      .withContext('two things in the migrated section share a key')
      .toBe(keys.length);
  });

  it('produces the same output twice, so a re-run is not a second migration', () => {
    const block = {
      key: 'k', type: SECTION_ARCHETYPE.HERO_BAND, variant: 'besidePicture',
      heading: 'A', body: '<p>b</p>', image: { url: 'https://example.test/p.jpg' }
    };

    expect(JSON.stringify(toSectionModel(block)))
      .toBe(JSON.stringify(toSectionModel(block)));
  });

  it('never mutates the document it was handed', () => {
    // The preview runs against the LIVE object the editor is rendering.
    const block = {
      key: 'k', type: SECTION_ARCHETYPE.COPY_CENTRED, heading: 'A', body: '<p>b</p>'
    };
    const before = JSON.stringify(block);

    toSectionModel(block);

    expect(JSON.stringify(block)).toBe(before);
  });
});

describe('flipping a whole page', () => {
  it('reports a section it cannot express rather than dropping it', () => {
    // Silence is the failure that matters: a preview of a page that is
    // quietly one band shorter looks completely fine.
    const { blocks, problems } = toSectionBlocks([
      { key: 'a', type: SECTION_ARCHETYPE.COPY_CENTRED, heading: 'A' },
      { key: 'b', type: 'somethingNobodyMapped' }
    ]);

    expect(blocks.length).withContext('a block was dropped').toBe(2);
    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('somethingNobodyMapped');
  });

  it('expresses every composed archetype the kit still declares', () => {
    // THE SAFETY NET. An archetype with no builder flips to nothing the new
    // renderer can draw, and the page loses that band silently.
    const repeaters = new Set<string>([
      SECTION_ARCHETYPE.LIST_GRID, SECTION_ARCHETYPE.LIST_ROWS,
      SECTION_ARCHETYPE.LIST_ARTICLES, SECTION_ARCHETYPE.TIMELINE,
      SECTION_ARCHETYPE.CAROUSEL, SECTION_ARCHETYPE.SLIDER
    ]);
    // The two that are the destination, not the source.
    const destinations = new Set<string>([SECTION_ARCHETYPE.SECTION, SECTION_ARCHETYPE.LIST]);

    const unmapped = SECTION_KIT
      .map((def) => def.archetype as string)
      .filter((archetype) => !repeaters.has(archetype) && !destinations.has(archetype))
      .filter((archetype) => {
        const variant = SECTION_KIT.find((d) => d.archetype === archetype)?.variants[0].key;
        const out = toSectionModel({ key: 'k', type: archetype, variant, heading: 'H' });
        return out['type'] !== SECTION_ARCHETYPE.SECTION;
      });

    expect(unmapped)
      .withContext('these archetypes have no mapping and would migrate into nothing')
      .toEqual([]);
  });
});
