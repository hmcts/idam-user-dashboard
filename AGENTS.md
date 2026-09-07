# Agents.md

## Overview

idam-user-dashboard is a frontend admin application for user account management.
The UI sits on top of idam-api which provides the backend endpoints.

## Workflow

- Plan code changes and summarise them for confirmation before applying them.
- Preserve unrelated worktree changes.
- Keep `package.json` and `yarn.lock` synchronized.
- Keep this file up to date when project conventions, known dependency constraints, or technical debt change.

## Dependency vulnerabilities

Audit production dependencies recursively before changing resolutions:

```bash
yarn npm audit --recursive --environment production
```

Treat `yarn-audit-known-issues` as a narrow, reviewed CI baseline—not a general
suppression file. Do not regenerate it before attempting remediation. Add an
entry only when current supported dependency versions provide no safe upgrade
path, and remove entries reported as resolved. Review its diff because Yarn
virtual dependency hashes can change when the lockfile changes.

Use resolutions only when a vulnerable transitive dependency cannot be fixed by
upgrading a declared dependency. Prefer the narrowest compatible resolution and
the minimum safe version. Treat resolutions as temporary exceptions and
periodically recheck whether supported declared dependency upgrades make them
unnecessary.

Never remove a resolution if doing so downgrades the package. Never introduce a
higher major merely to silence an audit. This project intentionally remains on
Express 4 types; the `@types/express` and
`@types/express-serve-static-core` resolutions prevent incompatible Express 5
types from entering transitive middleware declarations.

Do not force an unsupported transitive major override. The current
`glob@10.5.0` deprecation is retained in `yarn-audit-known-issues` because the
latest Jest reporters still require that range; recheck it when Jest updates.

After dependency changes, run:

```bash
yarn install
yarn npm audit --recursive --environment production
yarn typecheck
yarn build
yarn lint
yarn test --runInBand
```

The Sass output from GOV.UK Frontend currently contains deprecation warnings;
warnings alone do not indicate a failed build. Local development serves plain
HTTP at `http://localhost:3100`.
