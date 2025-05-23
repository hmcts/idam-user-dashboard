const envConfig = require('config');

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
    endpoint: envConfig.get('services.idam.url.testingSupportApi'),
    timeout: 30000
  },
  JSONResponse: {},
  ChaiWrapper: {
    require: 'codeceptjs-chai'
  },
  ApiDataFactory: {
    endpoint: envConfig.get('services.idam.url.testingSupportApi'),
    cleanup: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    onRequest: async (request) => {
      const testToken = await codeceptjs.container.support('testingToken');
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
  autoLogin: {
    enabled: true,
    saveToFile: false,
    inject: 'login',
    users: {
      admin: {
        // loginAs function is defined in `steps_file.js`
        login: (I) => {
          I.say('performing autologin');
          const adminIdentity = codeceptjs.container.support('adminIdentity');
          I.loginAs(adminIdentity.email, adminIdentity.secret);
          I.say('Completed autologin');
        },
        // if we see manage users page,  we are logged in
        check: (I) => {
          I.amOnPage('/');
          I.say('performing login check');
          I.retry({ retries: 9, minTimeout: 500 }).seeElement('h1');
          I.see('What do you want to do?', 'h1');
          I.say('completed login check');
        }
      }
    }
  },
  tryTo: {
    enabled: true
  }
};
