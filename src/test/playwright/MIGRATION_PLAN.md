# Playwright Cutover Plan

## Scope

This plan covers migration and decommissioning of `src/test/v2/functional` and `src/test/v2/accessibility` CodeceptJS suites in favor of Playwright Test.

## Migration Status

Migrated suites (Playwright equivalents exist):

- `register_user`
- `register_private_beta_citizen`
- `view_user`
- `search_user`
- `suspend_user`
- `delete_user`
- `edit_user`
- `edit_user_remove_sso`
- `generate_user_report`
- `sign_in`
- `error_page`
- `accessibility`

## Exit Criteria Before Decommission

1. Playwright CI green for migrated suites on mainline for at least 5 consecutive runs.
2. Flakiness rate is acceptable (no recurring retries/failures without code changes).
3. Reporting parity confirmed (test list, pass/fail visibility, artifacts).
4. Team sign-off that critical paths are covered and stable.
5. Cross-browser strategy decided:
   - keep CodeceptJS cross-browser until Playwright replacement is ready, or
   - migrate cross-browser to Playwright projects first.

## Recommended Cutover Steps

1. Run Playwright suites in CI alongside CodeceptJS for a short overlap window.
2. Switch CI gating from CodeceptJS v2 suites to Playwright suites.
3. Keep CodeceptJS jobs as non-blocking fallback for one release cycle.
4. Remove CodeceptJS v2 suite invocations from package scripts and pipelines.
5. Remove obsolete CodeceptJS config/types/helpers that are no longer referenced.

## Candidate Removals (After Cutover)

- `src/test/v2/functional/*_test.ts`
- `src/test/v2/accessibility/accessibility_test.ts`
- `src/test/v2/common/steps_file.ts` (once no Codecept suite depends on it)
- `src/test/v2/functional/codecept.conf.*`
- `src/test/v2/accessibility/codecept.conf.*`
- Legacy Codecept scripts in `package.json` (only after CI cutover)

## Risks and Mitigations

- Risk: Hidden behavior differences between frameworks.
  - Mitigation: overlap runs, compare failures, keep fallback window.
- Risk: Missing env/setup in Playwright CI.
  - Mitigation: explicit env validation and early skip/fail messaging.
- Risk: Loss of accessibility report format parity.
  - Mitigation: align artifact expectations before removing Codecept a11y job.
