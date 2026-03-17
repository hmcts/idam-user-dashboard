import { chromium, firefox, FullConfig, request, webkit } from '@playwright/test';
import { mkdir } from 'fs/promises';
import path from 'path';
import { SetupDao } from './helpers/setup-dao';
import { getAdminEmailForProject, getStorageStatePath } from './helpers/auth-state';
import { loginAs } from './helpers/ui-auth';

const envConfig = require('config');

const rawIdamApiUrl = String(envConfig.get('services.idam.url.api') || '');
const rawTestingSupportApiUrl = String(envConfig.get('services.idam.url.testingSupportApi') || '');
const normalizeUrl = (url: string): string => url.replace(/\/+$/, '');

const idamApiUrl = normalizeUrl(rawIdamApiUrl);
const testingSupportApiUrl = normalizeUrl(rawTestingSupportApiUrl);

function getBrowserType(browserName: string) {
  switch (browserName) {
    case 'chromium':
      return chromium;
    case 'firefox':
      return firefox;
    case 'webkit':
      return webkit;
    default:
      throw new Error(`Unsupported browser for storageState setup: ${browserName}`);
  }
}

async function createAdminStorageState(project: FullConfig['projects'][number]): Promise<void> {
  if (!process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET) {
    throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is required');
  }

  const browserName = String(project.use.browserName || '');
  const browserType = getBrowserType(browserName);
  const browser = await browserType.launch({
    headless: typeof project.use.headless === 'boolean'
      ? project.use.headless
      : process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  });

  const idamApi = await request.newContext({
    baseURL: idamApiUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    ignoreHTTPSErrors: true,
  });

  const testingSupportApi = await request.newContext({
    baseURL: testingSupportApiUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ignoreHTTPSErrors: true,
  });

  try {
    const setupDao = new SetupDao(idamApi, testingSupportApi);
    const adminEmail = getAdminEmailForProject(project.name);
    await setupDao.setupAdmin(adminEmail);
    const adminIdentity = setupDao.getAdminIdentity();

    const context = await browser.newContext({
      baseURL: String(project.use.baseURL || ''),
      ignoreHTTPSErrors: true,
    });

    try {
      const page = await context.newPage();
      await loginAs(page, adminIdentity.email, adminIdentity.secret);

      const storageStatePath = getStorageStatePath(project.name);
      await mkdir(path.dirname(storageStatePath), { recursive: true });
      await context.storageState({ path: storageStatePath });
    } finally {
      await context.close();
    }
  } finally {
    await idamApi.dispose();
    await testingSupportApi.dispose();
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  for (const project of config.projects) {
    await createAdminStorageState(project);
  }
}
