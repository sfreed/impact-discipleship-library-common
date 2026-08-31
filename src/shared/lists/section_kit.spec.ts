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
  it('declares sixteen archetypes - the census fourteen, plus the home page\'s two', () => {
    // FOURTEEN came from the census of the twelve public pages. SLIDER and
    // COUNTDOWN came later (2026-08-31) from the home page, which was never
    // in that census: both were behaviour rather than layout and would
    // otherwise have stayed bespoke components forever.
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
  it('gives the hero band a list of buttons, and the split hero its note', () => {
    // The hero's two FIXED button slots went away on 2026-08-31 - one look,
    // buttons as entries. `entries` where `cta2` used to be is the whole
    // change, and existing heroes were migrated by
    // scripts/hero-buttons-to-entries.js rather than losing their buttons.
    expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, 'buttonList').entries).toBeTrue();
    expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, 'buttonList').cta2).toBeUndefined();

    expect(kitFields(SECTION_ARCHETYPE.HERO_SPLIT, 'standard').note).toBeTrue();
    // The split hero has one way in, not two.
    expect(kitFields(SECTION_ARCHETYPE.HERO_SPLIT, 'standard').cta2).toBeUndefined();
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
      SECTION_ARCHETYPE.SLIDER
    ];
    const buttonBearing: string[] = [
      SECTION_ARCHETYPE.HERO_BAND, SECTION_ARCHETYPE.HERO_SPLIT,
      SECTION_ARCHETYPE.COPY_MEDIA, SECTION_ARCHETYPE.COPY_CENTRED,
      SECTION_ARCHETYPE.COUNTDOWN
    ];

    const mismatched: string[] = [];
    for (const def of SECTION_KIT as readonly ArchetypeDef[]) {
      for (const variant of def.variants) {
        const exception = buttonBearing.includes(def.archetype);
        const shouldHave = listArchetypes.includes(def.archetype) || exception;
        if (shouldHave !== !!variant.fields.entries) {
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
