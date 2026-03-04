# Playwright Test Harness

This folder is the migration target for replacing CodeceptJS tests with Playwright Test.

## Commands

- `yarn test:pw:list` lists discovered Playwright tests.
- `yarn test:pw` runs Playwright tests with `playwright.config.ts`.

## Environment

- `TEST_URL` is supported and normalised to remove trailing `/`.
- `TEST_HEADLESS` is supported (`true`/`false`).
- `FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET` is required for most functional scenarios.

## Structure

- `fixtures/base.fixture.ts`: core fixtures (`setupDao`, API contexts).
- `fixtures/admin.fixture.ts`: auto-login admin fixture with auto-skip when required secret is missing.
- `helpers/`: shared navigation, locators, and action helpers.
- `specs/`: migrated Playwright specs.

## Current Coverage

The following v2 suites are migrated:

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

See `MIGRATION_PLAN.md` for decommission criteria and cutover steps.
