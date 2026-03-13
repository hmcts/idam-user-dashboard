import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base.fixture';
import { loginAs } from '../helpers/ui-auth';

async function loginWithCredentials(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  const heading = (await page.locator('h1').innerText()).trim();

  if (heading === 'Sign in') {
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    return;
  }

  if (heading === 'Enter your email address') {
    await page.locator('[name="email"]').fill(email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    return;
  }

  if (heading === 'Enter your password') {
    await page.locator('[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    return;
  }

  throw new Error(`Unexpected login heading "${heading}"`);
}

test.describe('v2_sign_in (Playwright migration)', () => {
  test.beforeEach(async ({ setupDao }) => {
    await setupDao.setupAdmin();
  });

  test('login as admin successfully', async ({ page, setupDao, context }) => {
    const admin = setupDao.getAdminIdentity();
    await loginAs(page, admin.email, admin.secret);
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    await expect(page.locator('body')).not.toContainText('Sorry, access to this resource is forbidden');
    await expect(page.locator('body')).not.toContainText('Status code: 403');
    await expect(page.locator('body')).not.toContainText('Status code: 400');
    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === 'idam_user_dashboard_session')).toBeTruthy();
  });

  test('login as user without access', async ({ page, setupDao, context }) => {
    const testUser = await setupDao.createUser();
    await loginWithCredentials(page, testUser.email, testUser.password);
    await expect(page.locator('h1')).toHaveText('Sorry, access to this resource is forbidden');
    await expect(page.locator('body')).toContainText('Status code: 403');
    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === 'idam_user_dashboard_session')).toBeTruthy();
  });

  test('Redirect back to login on the callback url when required OIDC parameters are missing', async ({ page }) => {
    await page.goto('/callback');
    await page.waitForTimeout(1000);
    expect(page.url().includes('/callback')).toBeFalsy();
  });
});
