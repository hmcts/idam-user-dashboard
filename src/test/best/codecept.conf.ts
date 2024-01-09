export const config: CodeceptJS.MainConfig = {
  tests: './*_test.ts',
  output: '../../../functional-output/functional/reports',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/',
      show: true,
      timeout: 20002,
      bypassCSP: false
    },
    REST: {
      endpoint: 'https://idam-testing-support-api.aat.platform.hmcts.net',
      timeout: 30000
    },
    JSONResponse: {},
    Testing_support: {
      require: './helpers/testing_support_helper.ts',
    },
    ApiDataFactory: {
      endpoint: "https://idam-testing-support-api.aat.platform.hmcts.net",
      cleanup: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      onRequest: async (request) => {
        let testToken = await codeceptjs.container.support('testingToken');
        console.log('Adding header with value ' + testToken);
        request.headers = { 'Authorization': 'bearer ' + testToken };
      }, 
      factories: {
        user: {
          factory: "./factories/users.ts",
          create: (data) =>  ({ method: 'POST',  url: '/test/idam/users', data })
        },
      }
    },
  },
  include: {
    I: './steps_file',
    setupDAO: './dao/SetupDao.ts'
  },
  plugins: {
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
  },
  name: 'best-practice'
};