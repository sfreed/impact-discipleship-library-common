# impact-discipleship-library-common

Shared code for the Impact Discipleship **Library** — an offline-first reader application and
the staff CMS that publishes into it.

The reader is built for distribution in low-connectivity regions. That requirement came out of
field experience in rural Zambia, where users frequently have connectivity at the moment the
app is installed and rarely afterward. Everything the reader needs is cached and prefetched up
front, and the application is expected to work indefinitely without a network.

This repository holds the code both applications have to agree on.

## What's in it

```
src/
  models/    domain models shared by the reader and the CMS
  queries/   Firestore query functions — the single definition of how content is fetched
  formio/    Form.io components and configuration for content authoring
  theme/     shared theming, including the reader's selectable display themes
```

Angular and TypeScript, with Firebase and Firestore underneath. The reader also ships to
Android through Capacitor.

## Design notes

**Offline-first is the constraint, not a feature.** Query functions live here rather than in
either application so that caching and prefetch behaviour is defined once. A query written
directly in the reader would be a query that the CMS cannot reason about, and cache warming
depends on both sides agreeing on exactly what gets fetched.

**Authoring goes through Form.io** so staff can change content structure without a release.
Those component definitions are shared because the CMS writes what the reader has to render.

**The reader supports full localization and translation**, and includes a custom text-quote
highlighting engine — the models for both live here.

## Context

I designed and built this, and still operate it. In 2025 I directed an agentic rewrite of both
the reader and the CMS in roughly three days; the original hand-built versions had taken nine
months. Related repository:
[impactdisciples---common](https://github.com/sfreed/impactdisciples---common).

— [Shane Freed](https://github.com/sfreed)
