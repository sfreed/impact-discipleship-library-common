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
  it('declares fourteen archetypes, one per layout the census found', () => {
    expect(SECTION_KIT.length).toBe(14);
    expect(new Set(SECTION_KIT.map((d) => d.archetype)).size).toBe(14);
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

  it('declares no variant the site does not use', () => {
    // The failure this catches is inventing a palette bigger than the site
    // needs. Every variant here should have been read off a real page; one
    // that was not is a guess, and a guess in a shared kit is a section
    // nobody asked for that everyone has to keep working.
    const used = new Set(LEGACY_RENDERINGS.map((r) => `${r.archetype}/${r.variant}`));
    const unused: string[] = [];
    for (const def of SECTION_KIT) {
      for (const variant of def.variants) {
        if (!used.has(`${def.archetype}/${variant.key}`)) {
          unused.push(`${def.archetype}/${variant.key}`);
        }
      }
    }

    expect(unused).toEqual([]);
  });
});

describe('coverage of the site as it stands', () => {
  it('maps one row per section the catalogue declares', () => {
    // 49 is the admin catalogue's own count of declared kinds. The admin
    // repo's spec pins the two lists together row by row; this is the cheap
    // version that fails first if a row is dropped while editing here.
    expect(LEGACY_RENDERINGS.length).toBe(49);
  });

  it('covers all twelve editable pages', () => {
    expect(new Set(LEGACY_RENDERINGS.map((r) => r.page)).size).toBe(12);
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

  it('allows two of a NON-singleton archetype on one page, told apart by surface', () => {
    // This is the point of separating colour from structure, so it is worth
    // pinning rather than leaving as a happy accident. Coaching's intro and
    // its closing block are both centred copy with buttons; what makes them
    // different bands is that one is light and one is tinted. Under the old
    // model they had to be two different TYPES to coexist on one page.
    const coaching = LEGACY_RENDERINGS.filter(
      (r) => r.page === 'coaching-with-impact' && r.archetype === SECTION_ARCHETYPE.COPY_CENTRED
    );

    expect(coaching.length).toBeGreaterThan(1);
    expect(new Set(coaching.map((r) => r.surface)).size).toBeGreaterThan(1);
  });

  it('records what each unusual rendering carries, so it cannot be dropped silently', () => {
    // Not every row needs a note, but the ones that hold behaviour do. These
    // three are the ones that would be a real defect if they went: a giving
    // button that could be pointed anywhere, an anchor other sections link
    // to, and a video that will not autoplay without the property form.
    const notes = LEGACY_RENDERINGS.filter((r) => r.carries).map((r) => r.carries!.toLowerCase());

    expect(notes.some((n) => n.includes('hosted payment'))).toBeTrue();
    expect(notes.some((n) => n.includes('#history'))).toBeTrue();
    expect(notes.some((n) => n.includes('[muted]'))).toBeTrue();
  });
});

describe('fields a variant offers', () => {
  it('gives the standard hero its two buttons and the split hero its note', () => {
    expect(kitFields(SECTION_ARCHETYPE.HERO_BAND, 'standard').cta2).toBeTrue();
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
    const listArchetypes: string[] = [
      SECTION_ARCHETYPE.LIST_ROWS, SECTION_ARCHETYPE.LIST_GRID,
      SECTION_ARCHETYPE.LIST_ARTICLES, SECTION_ARCHETYPE.LIST_COLUMNS,
      SECTION_ARCHETYPE.TIMELINE
    ];

    const mismatched: string[] = [];
    for (const def of SECTION_KIT as readonly ArchetypeDef[]) {
      for (const variant of def.variants) {
        // The button-list hero is the one deliberate exception: it is not a
        // list SECTION, but its buttons are entries.
        const exception = def.archetype === SECTION_ARCHETYPE.HERO_BAND && variant.key === 'buttonList';
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
