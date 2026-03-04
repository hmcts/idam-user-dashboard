import { test, expect } from '../fixtures/admin.fixture';

test.describe('v2_error_page (Playwright migration)', () => {
  test('view error page', async ({ page }) => {
    await page.goto('/noSuchPage');
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page.locator('body')).toContainText('Status code: 404');
  });
});
