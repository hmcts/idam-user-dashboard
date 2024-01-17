import supportedBrowsers from './supportedBrowsers';

const getBrowserConfig = browserGroup => {
  const browserConfig: any[] = [];

  for (const candidateBrowser in supportedBrowsers[browserGroup]) {
    if (candidateBrowser) {
      const candidateCapabilities = {
        ...supportedBrowsers[browserGroup][candidateBrowser]
      };

      browserConfig.push({
        browser: candidateCapabilities.browserName,
        capabilities: candidateCapabilities,
      });
    } else {
      console.error('ERROR: supportedBrowsers.js is empty or incorrectly defined');
    }
  }

  return browserConfig;
};

export const config: CodeceptJS.MainConfig = {
  tests: '../best/*_test.ts',
  output: '../../../functional-output/cross-browser/reports',
  helpers: {
    Playwright: {
      url: process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/',
      show: false,
      timeout: 20002,
      bypassCSP: false,
      ignoreHTTPSErrors: true,
    },
    REST: {
      endpoint: 'https://idam-testing-support-api.aat.platform.hmcts.net',
      timeout: 30000
    },
    JSONResponse: {},
    ChaiWrapper: {
      require: 'codeceptjs-chai'
    },
    Testing_support: {
      require: '../best/helpers/testing_support_helper.ts',
    },
    ApiDataFactory: {
      endpoint: 'https://idam-testing-support-api.aat.platform.hmcts.net',
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
          factory: '../best/factories/users.ts',
          create: (data) =>  ({ method: 'POST',  url: '/test/idam/users', data })
        },
      }
    },
  },
  include: {
    I: '../best/steps_file',
    setupDAO: '../best/dao/SetupDao.ts'
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
  name: 'cross-best-practice',
  multiple: {
    /*
    bestcross: {
      browsers: [
        {
          browser: "firefox",
          capabilties: {
            platformName: 'macOS 10.15',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_Firefox_latest',
            },          
          }
        },
        {
          browser: "chrome",
          capabilties: {
            platformName: 'macOS 10.15',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_chromium_latest',
            },          
          }
        },
        {
          browser: "chrome",
          capabilties: {
            platformName: 'Windows 10',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Win_chromium_latest',
            },          
          }
        }
      ]
    },
    */
    webkit: {
      browsers: getBrowserConfig('webkit'),
    },
    chromium: {
      browsers: getBrowserConfig('chromium'),
    },
    /*
    firefox: {
      browsers: getBrowserConfig('firefox'),
    },
    */
  },
};
