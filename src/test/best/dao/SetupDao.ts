const { I } = inject();

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
      const tokenRsp = await I.sendPostRequest('https://idam-api.aat.platform.hmcts.net/o/token', { 
        'grant_type':'client_credentials',
        'client_id':'idam-functional-test-service',
        'client_secret': process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET,
        'scope':'profile roles' ,
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

    const testToken = await this.getToken();
    I.amBearerAuthenticated(testToken);
    const email = 'testadmin@admin.local';
    const secret = process.env.SMOKE_TEST_USER_PASSWORD;
    const adminRsp = await I.sendPostRequest('/test/idam/users', { 
      'password': secret,
      'user' : {
        'email':email,
        'forename':'admin',
        'surname':'test',
        'roleNames': [
          'idam-user-dashboard--access'
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
          email: email,
          secret: secret
        }
      }
    });
  }
}

export = new SetupDAO();