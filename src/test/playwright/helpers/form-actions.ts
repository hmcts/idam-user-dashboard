import { Page } from '@playwright/test';
import { clickAndExpectBanner } from './resilient-actions';

export async function saveExpectSuccess(page: Page): Promise<void> {
  await clickAndExpectBanner(
    page,
    () => page.getByRole('button', { name: 'Save' }).click(),
    'h2.govuk-notification-banner__title',
    'Success',
    'h3.govuk-notification-banner__heading',
    'User details updated successfully'
  );
}

export async function saveExpectProblem(page: Page): Promise<void> {
  await clickAndExpectBanner(
    page,
    () => page.getByRole('button', { name: 'Save' }).click(),
    'h2.govuk-error-summary__title',
    'There is a problem'
  );
}
