const envConfig = require('config');
const { I } = inject();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@admin.local';
const ADMIN_ROLE_NAME = 'iud-test-admin';
const WORKER_ROLE_NAME = 'iud-test-worker';

class SetupDAO {

  setToken(tokenValue: string) {
    codeceptjs.container.append({
      support: {
        testingToken: tokenValue
      }
    });
  }
  
  async getToken() {
    if (!codeceptjs.container.support('testingToken')) {
      console.log('testing token is not set');
      const tokenRsp = await I.sendPostRequest(`${envConfig.get('services.idam.url.api')}/o/token`, { 
        'grant_type':'client_credentials',
        'client_id':'idam-functional-test-service',
        'client_secret': process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET,
        'scope':'profile roles',
      },
      {
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      I.seeResponseCodeIsSuccessful();
      this.setToken(tokenRsp.data.access_token);
    }
        
    return codeceptjs.container.support('testingToken');
  }

  async setupAdmin() {
    if (codeceptjs.container.support('adminIdentity')) {
      console.log('admin already setup');
      return;
    }

    console.log('setup admin');
    await this.setupAdminRole();

    const testToken = await this.getToken();
    I.amBearerAuthenticated(testToken);
    const secret = process.env.SMOKE_TEST_USER_PASSWORD;
    const adminRsp = await I.sendPostRequest('/test/idam/users', { 
      'password': secret,
      'user' : {
        'email':ADMIN_EMAIL,
        'forename':'admin',
        'surname':'test',
        'roleNames': [
          'idam-user-dashboard--access',
          ADMIN_ROLE_NAME
        ]
      }
    },
    {
      'Content-Type': 'application/json'
    });
    if (adminRsp.status == 409) {
      I.seeResponseCodeIs(409);
    } else {
      I.seeResponseCodeIsSuccessful();
    }
    codeceptjs.container.append({
      support: {
        adminIdentity: {
          email: ADMIN_EMAIL,
          secret: secret
        }
      }
    });
  }

  async setupAdminRole() {
    if (codeceptjs.container.support('adminRole')) {
      console.log('admin role already setup');
      return;
    }
    console.log('setup admin role');
    await this.setupWorkerRole();
  
    const testToken = await this.getToken();
    I.amBearerAuthenticated(testToken);
  
    const adminRoleRsp = await I.sendPostRequest('/test/idam/roles', {
      'name':ADMIN_ROLE_NAME,
      'assignableRoleNames': [
        WORKER_ROLE_NAME
      ]
    },
    {
      'Content-Type': 'application/json'
    });
    if (adminRoleRsp.status == 409) {
      I.seeResponseCodeIs(409);
    } else {
      I.seeResponseCodeIsSuccessful();
    }
    codeceptjs.container.append({
      support: {
        adminRole: {
          name: ADMIN_ROLE_NAME,
          assignableRoleNames: [
            WORKER_ROLE_NAME
          ]
        }
      }
    });
  }

  async setupWorkerRole() {
    if (codeceptjs.container.support('workerRole')) {
      console.log('worker role already setup');
      return;
    }
    console.log('setup worker role');
  
    const testToken = await this.getToken();
    I.amBearerAuthenticated(testToken);
  
    const adminRoleRsp = await I.sendPostRequest('/test/idam/roles', {
      'name':WORKER_ROLE_NAME
    },
    {
      'Content-Type': 'application/json'
    });
    if (adminRoleRsp.status == 409) {
      I.seeResponseCodeIs(409);
    } else {
      I.seeResponseCodeIsSuccessful();
    }
    codeceptjs.container.append({
      support: {
        workerRole: {
          name: WORKER_ROLE_NAME
        }
      }
    });
  }

  getWorkerRole() {
    return codeceptjs.container.support('workerRole');
  }

  getAdminRole() {
    return codeceptjs.container.support('adminRole');
  }

}

export = new SetupDAO();