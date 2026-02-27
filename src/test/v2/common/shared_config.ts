const envConfig = require('config');

function getSetupDao() {
  return codeceptjs.container.support('setupDAO');
}

const testingSupportApiUrl = String(envConfig.get('services.idam.url.testingSupportApi') || '');

export const shared_config = {
  include: {},
  helpers: {},
  plugins: {},
};

shared_config.include = {
  I: '../common/steps_file',
  setupDAO: '../common/dao/SetupDao.ts'
};

shared_config.helpers = {
  Playwright: {
    browser: 'chromium',
    url: process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/',
    show: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS !== 'true' : false,
    timeout: 20002,
    bypassCSP: false,
    capabilities: {}
  },
  A11yHelper: {
    require: 'codeceptjs-a11y-helper',
    axeOptions: {
      runOnly: {
        values: [
          'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'
        ],
      },
    },
    outputDir: 'functional-output/accessibility',
    reportFileName: 'a11y-audit.html',
  },
  REST: {
    endpoint: testingSupportApiUrl,
    timeout: 30000
  },
  JSONResponse: {},
  ChaiWrapper: {
    require: 'codeceptjs-chai'
  },
  ApiDataFactory: {
    endpoint: testingSupportApiUrl,
    cleanup: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    onRequest: async (request) => {
      const testToken = await getSetupDao().getToken();
      request.headers = { 'Authorization': 'bearer ' + testToken };
    },
    factories: {
      user: {
        factory: '../common/factories/users.ts',
        create: (data) =>  ({ method: 'POST',  url: '/test/idam/users', data })
      },
      role: {
        factory: '../common/factories/roles.ts',
        create: (data) =>  ({ method: 'POST',  url: '/test/idam/roles', data })
      },
      service: {
        factory: '../common/factories/services.ts',
        create: (data) =>  ({ method: 'POST',  url: '/test/idam/services', data })
      }
    },
    REST : {
      timeout: 29999
    }
  },
};

shared_config.plugins = {
  allure: {
    enabled: true,
    require: '@codeceptjs/allure-legacy'
  },
  auth: {
    enabled: true,
    saveToFile: false,
    inject: 'login',
    users: {
      admin: {
        // loginAs function is defined in `steps_file.js`
        login: async (I) => {
          await I.say('performing autologin');
          const adminIdentity = getSetupDao().getAdminIdentity();
          await I.loginAs(adminIdentity.email, adminIdentity.secret);
          await I.say('Completed autologin');
        },
        fetch: async () => undefined,
        restore: async () => {},
        // if we see manage users page,  we are logged in
        check: async (I) => {
          await I.amOnPage('/');
          await I.say('performing login check');
          await I.waitForElement('h1', 10);
          await I.see('What do you want to do?', 'h1');
          await I.say('completed login check');
        }
      }
    }
  }
};
