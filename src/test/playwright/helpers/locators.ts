import { Locator, Page } from '@playwright/test';

export function locateDataForTitle(page: Page, title: string): Locator {
  return page.locator(`xpath=//dt[normalize-space()="${title}"]/following-sibling::dd[1]`);
}

export function locateStrongDataForTitle(page: Page, title: string): Locator {
  return page.locator(`xpath=//dt[normalize-space()="${title}"]/following-sibling::dd[1]//strong[1]`);
}

export function roleInput(page: Page, roleName: string): Locator {
  return page.locator(`input[name="roles"][value="${roleName}"]`);
}

export function roleContainer(page: Page, roleName: string): Locator {
  return roleInput(page, roleName).locator('xpath=ancestor::div[contains(@class,"govuk-checkboxes__item")]').first();
}
