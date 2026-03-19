import { test, expect } from '../fixtures/admin.fixture';

test.describe('error_page', () => {
  test('view error page', async ({ page }) => {
    await page.goto('/noSuchPage');
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page.locator('body')).toContainText('Status code: 404');
  });
});
