import { Page } from '@playwright/test';
import { clickAndExpectPage, gotoAndExpectHeading } from './resilient-actions';

export async function goToManageUser(page: Page, userId: string): Promise<void> {
  await gotoAndExpectHeading(page, `/user/${userId}/details`, 'User Details');
}

export async function navigateToSearchUser(page: Page): Promise<void> {
  await gotoAndExpectHeading(page, '/', 'What do you want to do?');
  await page.getByLabel('Manage an existing user', { exact: true }).check();
  await clickAndExpectPage(
    page,
    () => page.getByRole('button', { name: 'Continue' }).click(),
    { expectedHeading: 'Search for an existing user', expectedUrl: /\/user\/manage/ }
  );
}

export async function navigateToManageUser(page: Page, searchValue: string): Promise<void> {
  await navigateToSearchUser(page);
  await page.locator('[name="search"]').fill(searchValue);
  await clickAndExpectPage(
    page,
    () => page.getByRole('button', { name: 'Search' }).click(),
    {
      expectedHeading: 'User Details',
      expectedUrl: /\/details/,
      retryAction: async () => {
        await navigateToSearchUser(page);
        await page.locator('[name="search"]').fill(searchValue);
      },
    }
  );
}

export async function navigateToEditUser(page: Page, userId: string): Promise<void> {
  await goToManageUser(page, userId);
  await clickAndExpectPage(
    page,
    () => page.getByRole('button', { name: 'Edit user' }).click(),
    { expectedHeading: 'Edit User', expectedUrl: /\/user\/edit/ }
  );
}

export async function navigateToGenerateReport(page: Page): Promise<void> {
  await gotoAndExpectHeading(page, '/', 'What do you want to do?');
  await page.getByLabel('Generate a user report', { exact: true }).check();
  await clickAndExpectPage(
    page,
    () => page.getByRole('button', { name: 'Continue' }).click(),
    { expectedHeading: 'Generate report', expectedUrl: /\/reports/ }
  );
}

export async function goToRegisterUser(page: Page): Promise<void> {
  await gotoAndExpectHeading(page, '/user/add', 'Add new user email');
}

export async function navigateToRegisterUser(page: Page): Promise<void> {
  await gotoAndExpectHeading(page, '/', 'What do you want to do?');
  await page.getByLabel('Add a new user', { exact: true }).check();
  await clickAndExpectPage(
    page,
    () => page.getByRole('button', { name: 'Continue' }).click(),
    { expectedHeading: 'Add new user email', expectedUrl: /\/user\/add/ }
  );
}
