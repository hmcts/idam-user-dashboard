import { expect, Page } from '@playwright/test';

export async function saveExpectSuccess(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('h2.govuk-notification-banner__title')).toHaveText('Success');
  await expect(page.locator('h3.govuk-notification-banner__heading')).toHaveText('User details updated successfully');
}

export async function saveExpectProblem(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
}
