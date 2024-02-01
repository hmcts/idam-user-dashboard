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
    show: false,
    timeout: 20002,
    bypassCSP: false,
    capabilities: {}
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
          const adminIdentity = codeceptjs.container.support('adminIdentity');
          I.loginAs(adminIdentity.email, adminIdentity.secret);
        },
        // if we see manage users page,  we are logged in
        check: (I) => {
          I.amOnPage('/');
          I.see('What do you want to do?');
        }
      }
    }
  }
};