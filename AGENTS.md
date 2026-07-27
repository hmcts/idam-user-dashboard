# Working agreement

- Plan code changes and summarise them for confirmation before applying them.
- Preserve unrelated worktree changes.
- Keep `package.json` and `yarn.lock` synchronized.

## Dependency vulnerabilities

Start with the read-only orchestration command:

```bash
yarn check:vulnerabilities
```

Use `--json` for concise machine-readable agent input, `--only <package>` to
focus on one finding, and `--explain <package>` when full dependency details
are needed. The command:

- audits production dependencies recursively;
- compares findings with `yarn-audit-known-issues`;
- distinguishes new, known, and resolved known issues;
- tests supported direct-parent upgrades in an isolated temporary project;
- invokes resolution analysis only for affected packages.

Treat `yarn-audit-known-issues` as a narrow, reviewed CI baseline—not a general
suppression file. Do not regenerate it before attempting remediation. Add an
entry only when current supported dependency versions provide no safe upgrade
path, and remove entries reported as resolved. Review its diff because Yarn
virtual dependency hashes can change when the lockfile changes.

For resolution maintenance, run:

```bash
yarn check:resolutions
yarn check:resolutions --only <package>
```

Use resolutions only when a vulnerable transitive dependency cannot be fixed by
upgrading a declared dependency. Prefer the narrowest compatible resolution and
the minimum safe version. Resolutions are temporary exceptions: periodically
remove those reported as `removable`, update `update-resolution`, and upgrade
the declared parent for `upgrade-parent`. Investigate `manual-review` and retain
`still-required`.

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
yarn check:vulnerabilities
yarn typecheck
yarn build
yarn lint
yarn test --runInBand
node --test scripts/check-resolutions.test.cjs
node --test scripts/check-vulnerabilities.test.cjs
```

The Sass output from GOV.UK Frontend currently contains deprecation warnings;
warnings alone do not indicate a failed build. Local development serves plain
HTTP at `http://localhost:3100`.
