import { expect, Page } from '@playwright/test';

export async function goToManageUser(page: Page, userId: string): Promise<void> {
  await page.goto(`/user/${userId}/details`);
  await expect(page.locator('h1')).toHaveText('User Details');
}

export async function navigateToSearchUser(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('What do you want to do?');
  await page.getByLabel('Manage an existing user', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('h1')).toHaveText('Search for an existing user');
}

export async function navigateToManageUser(page: Page, searchValue: string): Promise<void> {
  await navigateToSearchUser(page);
  await page.locator('[name="search"]').fill(searchValue);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('h1')).toHaveText('User Details');
}

export async function navigateToEditUser(page: Page, userId: string): Promise<void> {
  await goToManageUser(page, userId);
  await page.getByRole('button', { name: 'Edit user' }).click();
  await expect(page.locator('h1')).toHaveText('Edit User');
}

export async function navigateToGenerateReport(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('What do you want to do?');
  await page.getByLabel('Generate a user report', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('h1')).toHaveText('Generate report');
}

export async function goToRegisterUser(page: Page): Promise<void> {
  await page.goto('/user/add');
  await expect(page.locator('h1')).toHaveText('Add new user email');
}

export async function navigateToRegisterUser(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('What do you want to do?');
  await page.getByLabel('Add a new user', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('h1')).toHaveText('Add new user email');
}
