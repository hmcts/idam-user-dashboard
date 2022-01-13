const Helper = require('@codeceptjs/helper');
//import Helper from '@codeceptjs/helper';
//let Helper = codecept_helper;
import {config} from '../../config';
import fetch from 'node-fetch';
//const fetch = require('node-fetch');

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
class IdamHelper extends Helper {

  createUser(email, forename, role, serviceRole) {
    console.log('Creating user with email: ', email);
    const data = {
      email: email,
      forename: forename,
      password: config.PASSWORD,
      roles: [{code: role}, {code: serviceRole}],
      surname: 'User',
      userGroup: {code: 'xxx_private_beta'},
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
}

module.exports = IdamHelper;
