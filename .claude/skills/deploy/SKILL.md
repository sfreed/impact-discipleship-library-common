---
name: deploy
description: Commit and push all pending work across the reader app, manager app, and their shared common submodule (in the right order), then verify the resulting GitHub Actions deploy to impactdisciplesdev succeeded. Use when the user says "push everything", "deploy", "commit all three repos", or similar for this project.
---

# Deploy: impact-discipleship-library-{new,manager-new,common}

Invoking this skill is itself the go-ahead to commit and push — don't re-ask
"should I commit?" once you're running it. Do still show what you're about
to commit (git status/diff) before doing it, and stop and ask if something
looks unexpected (files you don't recognize as part of the work just done,
a repo already mid-conflict, etc.) rather than steamrolling past it.

## The shape of this project

Three separate git repos, normally checked out as siblings:

- `c:/web/repo/impact-discipleship-library-common` — the shared submodule's
  own canonical remote (rarely worked in directly).
- `c:/web/repo/impact-discipleship-library-new` (reader app) — has its own
  checkout of that submodule at `src/common`.
- `c:/web/repo/impact-discipleship-library-manager-new` (manager app) — has
  a **separate, independent checkout** of the same submodule, also at
  `src/common`.

Both apps' `src/common` are real, independent git working copies of the same
remote (`impact-discipleship-library-common`), not symlinks/junctions — a
change made in one does not appear in the other until it's committed, pushed,
and the other side is synced. This skill file itself lives at
`src/common/.claude/skills/deploy/SKILL.md`, so it's available from either
app repo's session without duplicating it.

All three repos deploy from the **`development`** branch, never `main`. If
any repo is unexpectedly on `main` (or anything else), stop and ask before
pushing — don't branch/switch unilaterally.

## Order of operations

The submodule must be committed and pushed **before** either app, since each
app commit needs to reference the submodule's new commit SHA (the pointer
bump only means something once that commit actually exists on the remote).

### 1. Survey all three repos first

```bash
cd "c:/web/repo/impact-discipleship-library-new/src/common" && git status --short
cd "c:/web/repo/impact-discipleship-library-manager-new/src/common" && git status --short
cd "c:/web/repo/impact-discipleship-library-new" && git status --short
cd "c:/web/repo/impact-discipleship-library-manager-new" && git status --short
```

If **both** `src/common` checkouts show changes, they're almost always
identical (edits get made in both checkouts in lockstep during a session -
see this project's CLAUDE.md/session history). Confirm with:

```bash
diff -rq "c:/web/repo/impact-discipleship-library-new/src/common" \
         "c:/web/repo/impact-discipleship-library-manager-new/src/common" --exclude=.git
```

Some files will show as differing purely over CRLF vs LF line endings
(pre-existing, unrelated to any real edit) - confirm with `diff -b` before
concluding two checkouts have actually diverged for real:

```bash
diff -b <file-in-reader-checkout> <file-in-manager-checkout>
```

If only one checkout has real changes, or the two have genuinely different
content, stop and figure out why before proceeding - don't blindly overwrite
one with the other.

### 2. Commit + push the submodule (only if it has changes)

From whichever checkout has the changes (reader's, by convention, when both
match):

```bash
cd "c:/web/repo/impact-discipleship-library-new/src/common"
git add -A
git commit -m "<describes what actually changed>"
git push origin development
```

Then sync the **other** checkout to the new commit (safe once you've
confirmed step 1's content actually matches):

```bash
cd "c:/web/repo/impact-discipleship-library-manager-new/src/common"
git fetch origin
git reset --hard origin/development
```

### 3. Commit + push each app repo

```bash
cd "c:/web/repo/impact-discipleship-library-new"
git add -A
git commit -m "<message>"
git push origin development
```

Repeat for `impact-discipleship-library-manager-new`. `git add -A` picks up
the bumped `src/common` pointer automatically alongside the app's own
changes - verify it's pointing at the commit you just pushed with
`git diff --cached -- src/common` before committing, if in doubt.

**Split into separate commits per repo when the pending changes are more
than one distinct piece of work** (e.g. leftover from an earlier
conversation turn that never got pushed, plus new work this turn) - don't
squash unrelated things into one commit just because they happened to be
sitting uncommitted at the same time. Use `git status`/`git diff` to find
the natural boundaries, and write a real commit message describing what
changed and why, not a generic "updates."

Windows line-ending warnings during `git add` (`LF will be replaced by
CRLF...`) are harmless noise, not errors.

Never `git push --force`. If a push is rejected (non-fast-forward), stop and
ask rather than force-pushing over something you don't have locally.

## 4. Verify the GitHub Actions deploy

Pushing `development` on either app repo fires
`.github/workflows/deploy-development.yml` (job name `deploy`), which runs
`npm run deploy:dev` against the `impactdisciplesdev` Firebase project. The
submodule repo itself has no deploy workflow - only the two app repos do.

For each app repo just pushed:

```bash
gh run list --repo SRFreed-Consulting-LLC/impact-discipleship-library \
  --branch development --limit 1 --json databaseId,status,headSha,url

gh run list --repo SRFreed-Consulting-LLC/impact-discipleship-library-manager \
  --branch development --limit 1 --json databaseId,status,headSha,url
```

Confirm `headSha` matches the commit you just pushed (`git rev-parse HEAD`
in that repo) - if no run has appeared yet, GitHub Actions can take a few
seconds to register the push; wait briefly and re-list rather than assuming
it failed to trigger.

Then block on it finishing (each deploy typically takes a few minutes -
build + `firebase deploy`; this is a legitimate synchronous wait, not a
poll-loop to avoid):

```bash
gh run watch <databaseId> --repo <owner>/<repo> --exit-status
```

If it fails, don't just report "it failed" - pull the actual error:

```bash
gh run view <databaseId> --repo <owner>/<repo> --log-failed
```

## Report back

For each repo touched: the commit SHA(s) and message(s). For each app repo:
the deploy run's pass/fail, with a link (`url` from the `gh run list`
output above). If a deploy failed, include the specific failing step and
error, not just the fact that it failed.
