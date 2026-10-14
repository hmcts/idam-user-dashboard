# Agents.md

## Overview

idam-user-dashboard is a frontend admin application for user account management.
The UI sits on top of idam-api which provides the backend endpoints.

## Workflow

- Plan code changes and summarise them for confirmation before applying them.
- Preserve unrelated worktree changes.
- Keep `package.json` and `yarn.lock` synchronized.
- Keep this file up to date when project conventions, known dependency constraints, or technical debt change.

## GOV.UK Frontend

The application uses `govuk-frontend@6.5.1` with refreshed GOV.UK branding.
Use Sass modules (`@use`) and Sass Loader's modern API. Each local Sass module
using GOV.UK functions or mixins needs its own module import; use
`govuk-functional-colour` for functional colours and `govuk-colour` for palette
colours.

Nunjucks loaders include the package root, so template imports use `dist/govuk/`
paths. Service/account navigation belongs in the `govukServiceNavigation` block,
the phase banner in `headerEnd`, breadcrumbs in `containerStart`, and footer
customisation in `govukFooter`. The build copies images, fonts and `manifest.json`.

Production CSP hashes must match rendered inline scripts. The shared-template
unit tests cover the GOV.UK support script and report scripts. Update the relevant
hash and tests when changing those scripts; do not allow arbitrary inline scripts.

The existing report-table layout hides tables at widths of 900px or less.
Use `display: none` there so hidden content cannot cause horizontal overflow.
A mobile report-table redesign remains a separate improvement.

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

As of 2026-10-07, the production audit also reports `braces@3.0.3` through
`micromatch` and `http-cache-semantics@4.1.1` through
`express-openid-connect` → `openid-client` → `got` → `cacheable-request`. The
current GitHub advisories list no patched release for either package, so these
two findings are recorded in the narrow audit baseline until an upstream fix
or a supported dependency path without them is available. They remain security
debt; recheck the advisories and remove the baseline entries once resolved.

After dependency changes, run:

```bash
yarn install
yarn npm audit --recursive --environment production
yarn typecheck
yarn build
yarn lint
yarn test --runInBand
```

Local development serves plain HTTP at `http://localhost:3100`.
