import fetch from 'node-fetch';
const Helper = require('@codeceptjs/helper');
import {config} from '../../config';

let agentToUse;
if (process.env.PROXY_SERVER) {
  console.log('using proxy agent: ' + process.env.PROXY_SERVER);
  const HttpsProxyAgent = require('https-proxy-agent');
  agentToUse = new HttpsProxyAgent(process.env.PROXY_SERVER);
} else if (process.env.LOCAL_TEST_SERVER) {
  // default agent
} else {
  console.log('using real agent');
  const Https = require('https');
  agentToUse = new Https.Agent({
    rejectUnauthorized: false
  });
}
const agent = agentToUse;
const MAX_RETRIES = 5;

class MyHelper extends Helper {

  createUserWithRole(email, forename, userRole) {

    const data = {
      email: email,
      forename: forename,
      password: config.PASSWORD,
      roles: userRole,
      surname: 'User',
      userGroup: {code: 'xxx_private_beta'}
    };

    return fetch(`${config.IDAM_API}/testing-support/accounts`, {
      agent: agent,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    }).then(res => res.json())
      .then((json) => {
        return json;
      })
      .catch(err => err);
  }

  deleteUser(email) {
    return fetch(`${config.IDAM_API}/testing-support/accounts/${email}`, {
      agent: agent,
      method: 'DELETE'
    })
      .catch(err => err);
  }

  async extractUrlFromNotifyEmail(searchEmail) {
    let url;
    let emailResponse = await this.getEmailFromNotifyWithMaxRetries(searchEmail, MAX_RETRIES);
    const regex = '(https.+)';
    const urlMatch = emailResponse.body.match(regex);
    if (urlMatch[0]) {
      url = urlMatch[0].replace(/https:\/\/idam-web-public[^\/]+/i, process).replace(')', '');
    }
    return url;
  }

  activateUserAccount(code, token) {
    const data = {
      code: code,
      password: config.PASSWORD,
      token: token
    };
    return fetch(`${config.IDAM_API}/activate`, {
      agent: agent,
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    }).then(response => {
      return response;
    }).catch(err => {
      console.log(err);
      let browser = this.helpers['Puppeteer'].browser;
      browser.close();
    });
  }
}

export = MyHelper;
