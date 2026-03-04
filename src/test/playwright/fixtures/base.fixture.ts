import { test as base, expect, request, APIRequestContext } from '@playwright/test';
import { SetupDao } from '../helpers/setup-dao';

const envConfig = require('config');

const rawIdamApiUrl = String(envConfig.get('services.idam.url.api') || '');
const rawTestingSupportApiUrl = String(envConfig.get('services.idam.url.testingSupportApi') || '');
const normalizeUrl = (url: string): string => url.replace(/\/+$/, '');

const idamApiUrl = normalizeUrl(rawIdamApiUrl);
const testingSupportApiUrl = normalizeUrl(rawTestingSupportApiUrl);

if (!/^https?:\/\//.test(idamApiUrl)) {
  throw new Error(`Invalid services.idam.url.api URL: "${rawIdamApiUrl}"`);
}
if (!/^https?:\/\//.test(testingSupportApiUrl)) {
  throw new Error(`Invalid services.idam.url.testingSupportApi URL: "${rawTestingSupportApiUrl}"`);
}

type DashboardFixtures = {
  idamApi: APIRequestContext;
  testingSupportApi: APIRequestContext;
  setupDao: SetupDao;
};

export const test = base.extend<DashboardFixtures>({
  idamApi: async ({ baseURL }, use) => {
    void baseURL;
    const context = await request.newContext({
      baseURL: idamApiUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
      ignoreHTTPSErrors: true,
    });
    await use(context);
    await context.dispose();
  },
  testingSupportApi: async ({ baseURL }, use) => {
    void baseURL;
    const context = await request.newContext({
      baseURL: testingSupportApiUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ignoreHTTPSErrors: true,
    });
    await use(context);
    await context.dispose();
  },
  setupDao: async ({ idamApi, testingSupportApi }, use) => {
    await use(new SetupDao(idamApi, testingSupportApi));
  },
});

export { expect };
