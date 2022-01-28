import axios from 'axios';
import configGlobal from 'config';

const Helper = require('@codeceptjs/helper');
import {config} from '../../config';

class MyHelper extends Helper {

  async createUserWithRoles(email, forename, userRoles) {
    const codeUserRoles: any[] = [];
    for (let i = 0; i < userRoles.length; i++) {
      codeUserRoles.push({'code': userRoles[i]});
    }
    try {
      const res = await axios(`${configGlobal.get('services.idam.url.api')}/testing-support/accounts`, {
        method: 'POST',
        data: {
          email: email,
          forename: forename,
          password: config.PASSWORD,
          roles: codeUserRoles,
          surname: config.SUPER_ADMIN_CITIZEN_USER_LASTNAME,
          userGroup: {code: 'xxx_private_beta'}
        },
        headers: {'Content-Type': 'application/json'},
      });
      return await res.data;
    } catch (err) {
      return await err;
    }
  }

  getAuthToken() {

    const userName=config.SMOKE_TEST_USER_USERNAME;
    const password = config.SMOKE_TEST_USER_PASSWORD;
    return axios(`${configGlobal.get('services.idam.url.api')}/loginUser?username=${userName}&password=${password}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    }).then(
      function (response) {
        if (response.status === 200) {
          return response.data;
        } else {
          console.log('Admin auth token failed first attempt with response ' + response.status + ' from ' + configGlobal.get('services.idam.url.api') + ' user: ' + userName + ' password ' + password);

          // retry!
          return axios(`${configGlobal.get('services.idam.url.api')}/loginUser?username=${userName}&password=${password}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          }).then(
            function (response) {
              if (response.status === 200) {
                return response.data;
              } else {
                console.log('Admin auth token failed second attempt with response ' + response.status + ' from ' + configGlobal.get('services.idam.url.api') + ' user: ' + userName + ' password ' + password);
              }
            }
          );
        }
      }
    ).then(
      function (json) {
        console.log('Admin auth token received');
        return json.api_auth_token;
      }
    );
  }

  async retireStaleUser(userId) {
    const authToken = await this.getAuthToken();
    return axios(`${configGlobal.get('services.idam.url.api')}/api/v1/staleUsers/${userId}/retire`, {
      method: 'POST',
      headers: {'Authorization': 'AdminApiAuthToken ' + authToken},
    }).then((response) => {
      if (response.status !== 200) {
        console.log('Error retiring stale user', response.status);
        throw new Error();
      }
    });
  }

  async deleteUser(email) {
    try {
      return await axios(`${configGlobal.get('services.idam.url.api')}/testing-support/accounts/${email}`, {
        method: 'DELETE',
      });
    } catch (err) {
      return await err;
    }
  }
}

export = MyHelper;
