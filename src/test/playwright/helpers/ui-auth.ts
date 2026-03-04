import { expect, Locator, Page } from '@playwright/test';

async function headingText(page: Page): Promise<string> {
  await expect(page.locator('h1')).toBeVisible();
  return (await page.locator('h1').first().innerText()).trim();
}

async function clickContinue(page: Page): Promise<void> {
  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.count()) {
    await continueButton.first().click();
    return;
  }

  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  await expect(submit).toBeVisible();
  await submit.click();
}

async function fillByLabelOrName(page: Page, label: string, name: string, value: string): Promise<void> {
  const labelControl = page.getByLabel(label, { exact: true });
  if (await labelControl.count()) {
    await labelControl.fill(value);
    return;
  }
  await page.locator(`[name="${name}"]`).fill(value);
}

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  const currentHeading = await headingText(page);

  if (currentHeading === 'What do you want to do?') {
    return;
  }

  if (currentHeading === 'Sign in') {
    await fillByLabelOrName(page, 'Email', 'email', email);
    await fillByLabelOrName(page, 'Password', 'password', password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    return;
  }

  if (currentHeading === 'Enter your email address') {
    await fillByLabelOrName(page, 'Email address', 'email', email);
    await clickContinue(page);
    await expect(page.locator('h1')).toHaveText('Enter your password');
    await fillByLabelOrName(page, 'Password', 'password', password);
    await clickContinue(page);
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    return;
  }

  if (currentHeading === 'Enter your password') {
    await fillByLabelOrName(page, 'Password', 'password', password);
    await clickContinue(page);
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    return;
  }

  throw new Error(`Unexpected login page heading: "${currentHeading}"`);
}

export async function clickAndExpectHeading(page: Page, buttonText: string, heading: string): Promise<void> {
  const button: Locator = page.getByRole('button', { name: buttonText });
  if (await button.count()) {
    await button.first().click();
  } else if (buttonText === 'Continue') {
    await clickContinue(page);
  } else {
    throw new Error(`Button "${buttonText}" not found`);
  }
  await expect(page.locator('h1')).toHaveText(heading);
}
