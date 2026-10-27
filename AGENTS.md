# Agents.md

## Overview

idam-user-dashboard is a frontend admin application for user account management.
The UI sits on top of idam-api which provides the backend endpoints.

## Node.js runtime

Local development and CI use Node.js `24.22.1` (see `.nvmrc`). The supported
runtime range is `^24.22.1`, keeping the application on patched Node.js 24.x
releases. Node.js `24.22.1` includes the fix for `CVE-2026-111497`.

## Workflow

- Plan code changes and summarise them for confirmation before applying them.
- Preserve unrelated worktree changes.
- Keep `package.json` and `yarn.lock` synchronized.
- Keep this file up to date when project conventions, known dependency constraints, or technical debt change.

## GOV.UK Frontend

The application uses `govuk-frontend@6.5.1`. Override the `govukHeader` template
block with `govukGenericHeader`, using its default black background. This service
explicitly retains the GOV.UK crown and wordmark, supplied through `logoHtml`
using `govukLogo` from `dist/govuk/macros/logo.njk`. The logo links to GOV.UK;
the dashboard name in Service navigation links to the application homepage.
`govukLogo` is an internal upstream macro, so recheck its contract and the logo
rendering tests when upgrading GOV.UK Frontend. This is a service-specific use
of the Generic header, with existing GOV.UK page branding retained.

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

The former `braces@3.0.3` advisory was withdrawn on 2026-10-23. Its audit
baseline entry and resolution were removed after confirming the supported
dependency ranges still resolve to `braces@3.0.3`.

As of 2026-10-26, the production audit continues to report
`http-cache-semantics@4.1.1` through `express-openid-connect` → `openid-client`
→ `got` → `cacheable-request`. The current GitHub advisory lists no patched
release, so this finding remains in the narrow audit baseline until an upstream
fix or a supported dependency path without it is available.

As of 2026-10-26, the production audit reports `@azure/msal-node@6.0.0` through
`@azure/identity`. The latest stable `@azure/identity@4.14.0` and beta
`@azure/identity@4.15.0-beta.1` still require the vulnerable MSAL 6.x range,
while the patched MSAL release is 7.1.0. The application does not directly use
the affected authorization-code flow, and forcing the unsupported transitive
major is prohibited, so the finding is recorded in the narrow audit baseline.
Recheck it when Azure Identity supports MSAL 7.1.0 or later.

As of 2026-10-21, the production audit also reports the deprecation of
`@opentelemetry/sdk-trace-web@2.5.0`, required by
`@azure/opentelemetry-instrumentation-azure-sdk@1.1.0-beta.1` through
`@azure/monitor-opentelemetry@1.20.1`. The current supported Azure Monitor
release still requires this package and the deprecation applies to newer 2.x
versions too, so the finding is recorded in the narrow audit baseline until
Azure publishes a dependency update. Recheck this entry when Azure Monitor
removes the dependency.

The same Azure Monitor dependency tree also reports deprecations for
`@opentelemetry/sdk-trace-node@2.10.0`,
`@opentelemetry/sdk-trace-base@2.5.0`, and
`@opentelemetry/propagator-jaeger@2.11.0`, through
`@opentelemetry/sdk-node@0.221.0` and `@opentelemetry/sdk-trace-web@2.5.0`.
These are recorded in the same narrow baseline until the upstream Azure and
OpenTelemetry packages remove the deprecated dependencies.

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
