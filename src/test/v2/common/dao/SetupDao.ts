const envConfig = require('config');
const { I } = inject();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@admin.local';
const ADMIN_ROLE_NAME = 'iud-test-admin';
const WORKER_ROLE_NAME = 'iud-test-worker';
const IDAM_API_URL = String(envConfig.get('services.idam.url.api') || '');
if (!/^https?:\/\//.test(IDAM_API_URL)) {
  throw new Error(`Invalid services.idam.url.api URL: "${envConfig.get('services.idam.url.api')}"`);
}

class SetupDAO {
  private testingToken?: string;
  private adminIdentity?: { email: string; secret: string };
  private adminRole?: { name: string; assignableRoleNames: string[] };
  private workerRole?: { name: string };

  setToken(tokenValue: string) {
    this.testingToken = tokenValue;
    codeceptjs.container.append({
      support: {
        testingToken: tokenValue
      }
    });
  }
  
  async getToken(): Promise<string> {
    if (!this.testingToken) {
      console.log('testing token is not set');
      const clientSecret = process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET;
      if (!clientSecret) {
        throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is not set');
      }
      const tokenRsp = await I.sendPostRequest(`${IDAM_API_URL}/o/token`, { 
        'grant_type':'client_credentials',
        'client_id':'idam-functional-test-service',
        'client_secret': clientSecret,
        'scope':'profile roles',
      },
      {
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      I.seeResponseCodeIsSuccessful();
      this.setToken(tokenRsp.data.access_token);
    }
    if (!this.testingToken) {
      throw new Error('Unable to initialise testing token');
    }
    return this.testingToken;
  }

  async setupAdmin() {
    if (this.adminIdentity) {
      console.log('admin already setup');
      return;
    }

    console.log('setup admin: ' + ADMIN_EMAIL);
    await this.setupAdminRole();

    const testToken = await this.getToken();
    I.amBearerAuthenticated(testToken);
    const secret = process.env.SMOKE_TEST_USER_PASSWORD || 'Pa55word11';
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
    this.adminIdentity = {
      email: ADMIN_EMAIL,
      secret: secret
    };
    codeceptjs.container.append({
      support: {
        adminIdentity: this.adminIdentity
      }
    });
  }

  async setupAdminRole() {
    if (this.adminRole) {
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
    this.adminRole = {
      name: ADMIN_ROLE_NAME,
      assignableRoleNames: [
        WORKER_ROLE_NAME
      ]
    };
    codeceptjs.container.append({
      support: {
        adminRole: this.adminRole
      }
    });
  }

  async setupWorkerRole() {
    if (this.workerRole) {
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
    this.workerRole = {
      name: WORKER_ROLE_NAME
    };
    codeceptjs.container.append({
      support: {
        workerRole: this.workerRole
      }
    });
  }

  getWorkerRole(): { name: string } {
    if (!this.workerRole) {
      throw new Error('workerRole is not initialised. Run setupWorkerRole() or setupAdminRole() first.');
    }
    return this.workerRole;
  }

  getAdminRole(): { name: string; assignableRoleNames: string[] } {
    if (!this.adminRole) {
      throw new Error('adminRole is not initialised. Run setupAdminRole() first.');
    }
    return this.adminRole;
  }

  getAdminIdentity(): { email: string; secret: string } {
    if (!this.adminIdentity) {
      throw new Error('adminIdentity is not initialised. Run setupAdmin() first.');
    }
    return this.adminIdentity;
  }

}

export = new SetupDAO();
