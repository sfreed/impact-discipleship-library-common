---
name: deploy
description: Commit and push pending work across the Impact Suite repos that consume this shared submodule (web, admin, reader) and the submodule itself, in the right order, then verify the deploys. Use when the user says "push everything", "deploy", "commit all the repos", or similar for this project.
---

# Deploy: impact-discipleship-library-common + its three consumers

The shared submodule (`impact-discipleship-library-common`) is checked out at
`src/common` in THREE sibling repos (checkouts are peers - none is the
"owner"; the admin checkout is usually where shared edits are made):

- `c:/web/repo/impactdisciples - web/src/common`          (public web site)
- `c:/web/repo/impactdisciples - admin/src/common`        (admin + Cloud Functions; functions copy
  the SDK-free `shared/{config,contract,lists}` slices in via `functions/scripts/sync-shared.js`)
- `c:/web/repo/impact-discipleship-library-new/src/common` (Library Reader)

(The former manager app `impact-discipleship-library-manager-new` is decommissioned - do not
look for a checkout there.)

## Order (pointers must never dangle)

1. In whichever checkout has the shared edits: `git -C <repo>/src/common status --short`; commit on
   `development`; **push the submodule first**: `git -C <repo>/src/common push origin development`.
2. Sync the other two checkouts to the same commit:
   `git -C <other>/src/common fetch origin development && git -C <other>/src/common checkout -B development FETCH_HEAD`
   (or fetch from the sibling path when offline:
   `git fetch "c:/web/repo/impactdisciples - admin/src/common" development`).
3. In each consumer repo: `git add src/common` (+ the app changes), commit, push `development`.
4. Verify nothing dangles: in each consumer `git ls-tree HEAD src/common` must name a commit that
   exists on the submodule's `origin/development`.

## Deploys (manual, per repo)

- web:    `npm run build-deploy-dev` / `build-deploy-prod` (hosting only).
- admin:  `npm run build-deploy-dev` / `build-deploy-prod` (hosting);
          `cd functions && npm run deploy-dev` / `deploy-prod` (Cloud Functions; predeploy runs
          lint + build, which re-copies the shared slices and runs the contract drift test).
          Rules/indexes deploy from admin's `firebase.json` too.
- reader: `npm run deploy:dev` / `deploy:prod` (hosting only). Pushing the reader's `development`
          also triggers its GitHub Actions workflow (`deploy-development.yml`), which runs the same
          `deploy:dev` - the only CI deploy in the suite.

## Checks before calling it done

- The three consumers build (`ng build`) and their unit suites pass.
- `functions`: `npm run build && npm test && npm run lint` green.
- If a function name/kind changed: the shared contract
  (`src/shared/contract/functions-contract.ts`) was updated FIRST, then `index.ts`, then the
  clients - `functions/test/contract.test.js` fails otherwise.
