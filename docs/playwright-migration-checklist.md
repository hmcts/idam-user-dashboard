# Playwright Migration Checklist

Last reviewed: 2026-03-17

This document records a repo-level audit of the CodeceptJS to Playwright migration by comparing the current branch against an older master copy of the application and its original `src/test/v2` CodeceptJS suites.

## Summary

The functional and accessibility suites are largely preserved and the current Playwright implementation covers the same main user flows as the old CodeceptJS suite. The main remaining gaps are around documentation of cross-browser scope changes and attaching run evidence from CI or a verified environment.

Two migration-sensitive behaviors were tightened during this audit:

- Cross-browser admin users now use project-specific identities to avoid clashes.
- Invitation lookup now polls again to tolerate delayed backend persistence.

## Checklist

### Scope

- [x] This PR replaces the existing CodeceptJS implementation with Playwright for the intended suites.
- [x] The migration scope is clearly stated: functional, accessibility, and cross-browser.
- [ ] Any areas intentionally left for follow-up are clearly documented.

### Coverage Preservation

- [x] Existing core functional coverage is preserved.
- [x] Existing core accessibility coverage is preserved.
- [ ] Existing cross-browser coverage is preserved, or any agreed change is explicitly documented.
- [x] Negative-path and permission/access scenarios are preserved.
- [x] No existing test behavior has been silently dropped.

### Authentication And Sessions

- [x] Codecept `autoLogin` has been replaced with a Playwright-native auth/session approach.
- [x] `storageState` is used where appropriate instead of repeated UI login for entities that exist for the duration of test suites (i.e. worker role name)
- [x] The migration still supports all current login flows used by the service.
- [x] Session reuse is safe across browsers, projects, and workers.

### Fixtures And Shared Test State

- [x] Codecept global/container state has been replaced with typed Playwright fixtures or equivalent explicit helpers.
- [x] Shared setup values such as admin identity, roles, and tokens are managed without hidden mutable globals.
- [x] Test setup is understandable and discoverable from the Playwright fixtures/helpers.

### Test Data And Backend Setup

- [x] Admin bootstrap behavior is preserved - use of testing support and handling of 409s
- [x] Admin role bootstrap behavior is preserved.
- [x] Worker role bootstrap behavior is preserved.
- [x] Test user creation behavior is preserved.
- [x] Role creation behavior is preserved.
- [x] Service creation behavior is preserved.
- [x] Invitation lookup/verification behavior is preserved.
- [x] Archive/update flows used by tests are preserved.
- [x] Idempotent setup behavior is preserved where the old suite tolerated "already exists".
- [x] Unique test data generation is preserved for parallel and repeatable execution.
- [x] Create the smallest amount of test data that the tests require (cleanup handled by testing support api)

### Cross-Browser Strategy

- [x] The browser/project matrix is clearly defined (move away from sauceLabs)
- [ ] The PR preserves the agreed cross-browser coverage level.
- [x] Browser/project-specific user isolation is preserved, or an explicit alternative strategy is documented. (specifically the admin login users)
- [x] Cross-browser execution preserves the current isolation model by using browser/project-specific test identities or equivalent isolated setup, so concurrent runs do not interfere with each other.
- [ ] Browser/project identity remains visible in reporting.
- [x] Cross-browser/admin-user clashes are explicitly handled - cross browser tests should not interfere with each other.

### Backend Flakiness Handling

- [x] Codecept-specific UI retries have not simply been copied over without justification.
- [x] Backend/eventual-consistency issues are handled with targeted Playwright or `playwright-common` patterns.
- [x] Retry logic is applied only at the unstable boundary, such as API polling or transient 5xx handling.
- [x] Any previous "Bad Gateway" or transient server handling still required by the environment is preserved in an explicit way.
- [x] Invite lookup or other delayed backend checks use polling/retry where still needed.

### `playwright-common` Adoption

- [ ] The PR clearly lists which `playwright-common` components are being used.
- [ ] `playwright-common` is used where it adds value, not just to maximise usage.
- [x] Repo-specific test logic remains custom where `playwright-common` is not a good fit.
- [ ] Any `playwright-common` runtime prerequisites are satisfied.
- [x] Any Playwright version compatibility requirements from `playwright-common` are satisfied.
- [x] Any Node version compatibility requirements from `playwright-common` are satisfied.

#### Assessment

Current usage: none.

The local assessment copy reviewed was `Desktop/playwright-common-1.1.2`.

Key compatibility constraints:

- `@hmcts/playwright-common@1.1.2` requires Node `>=20.11.1`
- `@hmcts/playwright-common@1.1.2` has peer dependencies on `@playwright/test` and `playwright-core` `^1.58.0`
- This repo now declares Node `^20.18.0` and uses `@playwright/test`, `playwright`, and `playwright-core` `^1.58.2`

Candidate components reviewed:

- `src/utils/retry.utils.ts`
  Useful in principle for API retry/backoff. The repo already has targeted retry logic for invite polling and transient page transitions, so adopting it would be a cleanup decision rather than a missing-capability fix.
- `src/utils/idam.utils.ts`
  Not a strong fit yet. This repo has custom testing-support flows for admin bootstrap, role creation, service creation, 409 tolerance, and invite lookup that are broader than the utility currently provides.
- `src/utils/axe.utils.ts`
  Potentially useful, but not a drop-in replacement for the current accessibility report contract because this repo currently generates a standalone HTML artifact under `functional-output/accessibility` for Jenkins publishing.
- `src/page-objects/pages/idam.po.ts`
  Not a good fit for the current service login journey because it targets the older username/password IDAM page only.
- `src/utils/config.utils.ts`
  Too small to justify the dependency by itself.
- `src/logging/logger.ts` and `src/logging/redaction.ts`
  Potentially useful if the test suite needs more structured logging or redaction around custom API helpers, but not enough on their own to justify adoption.

Additional note:

- `callWith429AwareRetry` was not present in the reviewed `1.1.2` source tree. The closest relevant utility in that version is `withRetry` plus `isRetryableError` in `src/utils/retry.utils.ts`.

Recommendation matrix:

- Adopt first: `src/utils/retry.utils.ts`
  This is the lowest-risk adoption target if the repo wants to use `playwright-common`. It can be applied to backend-facing polling or API retry boundaries such as invitation lookup or token/bootstrap calls without changing the current UI-flow helpers or Jenkins reporting contract.
- Consider later: `src/logging/logger.ts` and `src/logging/redaction.ts`
  These could improve structured logs around setup helpers, but they are optional and do not solve an existing migration gap.
- Defer: `src/utils/axe.utils.ts`
  It is compatible now, but it would require reshaping the current accessibility artifact strategy because this repo writes per-page JSON plus a consolidated HTML report under `functional-output/accessibility` for Jenkins publishing.
- Do not adopt currently: `src/page-objects/pages/idam.po.ts` and `src/utils/idam.utils.ts`
  They do not align cleanly with the current login journey or the repo's custom testing-support bootstrap behavior.

What would still be required before adoption:

- Install `@hmcts/playwright-common` and revalidate the lockfile in CI
- Decide the first integration target explicitly, rather than importing multiple helpers at once
- Keep the current accessibility reporting contract unless there is an agreed Jenkins/reporting change
- Verify that any adopted helper actually reduces repo code or maintenance burden rather than just moving logic into a dependency

### Accessibility

- [x] Accessibility tests are migrated to Playwright.
- [x] The same WCAG tags/ruleset coverage is preserved unless an intentional change is documented.
- [x] Accessibility reporting behavior is defined clearly.
- [x] Accessibility reporting moved into Axe (for output report/artifact).
- [x] If separate accessibility artifacts remain, the CI/reporting contract is documented.

### Reporting

- [x] Allure is used for Playwright.
- [x] Functional report output paths are defined and wired into CI.
- [x] Cross-browser report output paths are defined and wired into CI.
- [x] Accessibility report output paths are defined and wired into CI if required.
- [x] Failure artifacts such as trace and screenshot are retained appropriately.
- [x] Report output remains usable for the current team and pipelines.

### Config And Scripts

- [x] CodeceptJS npm scripts have been replaced with Playwright equivalents.
- [x] There are clear scripts for functional execution.
- [x] There are clear scripts for cross-browser execution.
- [x] There are clear scripts for accessibility execution.
- [x] There are clear scripts for Allure generation if needed separately (for example renaming cross browser tests)
- [x] Environment-driven configuration is preserved, including test URL, headless mode, and secrets.

### CI / Pipeline

- [x] Jenkins or equivalent CI has been updated to execute the new Playwright suites.
- [x] Jenkins or equivalent CI has been updated to publish the new reports.
- [x] Any archived artifacts are still produced where needed.

### Documentation

- [x] Local run instructions have been updated.
- [ ] CI/runtime prerequisites have been updated.
- [ ] Required environment variables are documented.
- [ ] Any intentional differences from the Codecept suite are documented.
- [ ] Any remaining follow-up work is documented.

### Quality / Validation

- [ ] The migrated suite passes locally or in CI as appropriate.
- [ ] The PR includes evidence that the new suites run successfully.
- [ ] No intentional reduction in coverage, isolation, or resilience has been left undocumented.
- [ ] Any changed assertions or behavior differences from the old suite are explicitly explained.

### Suggested PR Notes

- [ ] Include a mapping from old Codecept feature/helper to the new Playwright or `playwright-common` replacement.
- [x] Include a short summary of what remains custom to this repo.
- [x] Include a short summary of known limitations or agreed compromises.

## Behavior Mapping

### Old CodeceptJS implementation

- `autoLogin` plugin with `login('admin')`
- `codeceptjs.container.support(...)` state for admin identity, worker role, admin role, and testing token
- `SetupDAO` for admin bootstrap and token caching
- `steps_file.ts` navigation helpers, retry helpers, invite lookup, and login flow handling
- SauceLabs multi-browser config with browser-specific admin identities
- Codecept accessibility helper and aggregated accessibility report generation

### Current Playwright implementation

- [`src/test/playwright/global-setup.ts`](../src/test/playwright/global-setup.ts) bootstraps browser-specific admin sessions once and saves per-project `storageState`
- [`src/test/playwright/fixtures/admin.fixture.ts`](../src/test/playwright/fixtures/admin.fixture.ts) replaces `autoLogin` with an auto fixture that consumes the saved `storageState` and validates the authenticated landing page
- [`src/test/playwright/fixtures/base.fixture.ts`](../src/test/playwright/fixtures/base.fixture.ts) provides typed API clients and `SetupDao`
- [`src/test/playwright/helpers/setup-dao.ts`](../src/test/playwright/helpers/setup-dao.ts) replaces container support state with explicit class state for token caching, roles, admin identity, test users, roles, services, and invite lookup
- [`src/test/playwright/helpers/auth-state.ts`](../src/test/playwright/helpers/auth-state.ts) centralises per-project admin identity and `storageState` file naming
- [`src/test/playwright/helpers/ui-auth.ts`](../src/test/playwright/helpers/ui-auth.ts) handles classic and modern login flows
- [`src/test/playwright/helpers/navigation.ts`](../src/test/playwright/helpers/navigation.ts) replaces the main page navigation helpers
- [`src/test/playwright/helpers/resilient-actions.ts`](../src/test/playwright/helpers/resilient-actions.ts) applies targeted retry/recovery only at unstable transition points such as page navigation, submit-result pages, and transient bad gateway responses
- [`playwright.crossbrowser.config.ts`](../playwright.crossbrowser.config.ts) defines the current local cross-browser project matrix
- [`src/test/accessibility/accessibility.spec.ts`](../src/test/accessibility/accessibility.spec.ts) and [`src/test/accessibility/generate-report.js`](../src/test/accessibility/generate-report.js) replace the old accessibility helper/report pipeline with Playwright plus Axe

### Repo-specific logic that remains custom

- Admin bootstrap and role bootstrap through the testing support API
- User, role, and service creation helpers
- Invite lookup and verification
- Application-specific navigation helpers and field locators
- Accessibility result aggregation/report generation

## Known Gaps / Follow-up

- Decide whether the reduced cross-browser matrix is the intended long-term replacement for the old SauceLabs coverage and document that decision.
- Reintroduce explicit targeted handling for transient bad gateway or delayed page transitions if the environment still needs it.
- Add PR or CI evidence showing successful functional, cross-browser, and accessibility runs.
- Document required environment variables and runtime prerequisites more explicitly.
- Document whether `playwright-common` was intentionally not adopted.
