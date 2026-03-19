import { expect, Page } from '@playwright/test';

type TransitionOptions = {
  expectedHeading: string;
  expectedUrl?: RegExp | string;
  retryAction?: () => Promise<void>;
};

async function hasBadGateway(page: Page): Promise<boolean> {
  const bodyText = ((await page.locator('body').textContent()) || '').toLowerCase();
  return bodyText.includes('bad gateway');
}

async function waitForExpectedPage(page: Page, options: TransitionOptions): Promise<void> {
  if (options.expectedUrl) {
    await expect(page).toHaveURL(options.expectedUrl, { timeout: 5_000 });
  }
  await expect(page.locator('h1')).toHaveText(options.expectedHeading, { timeout: 5_000 });
}

export async function gotoAndExpectHeading(page: Page, url: string, expectedHeading: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toHaveText(expectedHeading, { timeout: 5_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 1) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }
    }
  }

  throw lastError;
}

export async function clickAndExpectPage(
  page: Page,
  action: () => Promise<void>,
  options: TransitionOptions
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await action();
      await waitForExpectedPage(page, options);
      return;
    } catch (error) {
      lastError = error;

      if (await hasBadGateway(page)) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForExpectedPage(page, options);
        return;
      }

      if (attempt === 1 && options.retryAction) {
        await options.retryAction();
        continue;
      }
    }
  }

  throw lastError;
}

export async function clickAndExpectBanner(
  page: Page,
  action: () => Promise<void>,
  titleSelector: string,
  expectedTitle: string,
  headingSelector?: string,
  expectedHeading?: string
): Promise<void> {
  await action();

  try {
    await expect(page.locator(titleSelector)).toHaveText(expectedTitle, { timeout: 5_000 });
  } catch (error) {
    if (!await hasBadGateway(page)) {
      throw error;
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator(titleSelector)).toHaveText(expectedTitle, { timeout: 5_000 });
  }

  if (headingSelector && expectedHeading) {
    await expect(page.locator(headingSelector)).toHaveText(expectedHeading);
  }
}
