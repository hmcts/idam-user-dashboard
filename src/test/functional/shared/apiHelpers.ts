import axios from 'axios';
import config from 'config';
import {config as testConfig} from '../../config';

export const createUserWithRoles = async (email, password, forename, userRoles) => {
  const codeUserRoles = userRoles.map(role => ({code: role}));

  try {
    return (await axios.post(
      `${config.get('services.idam.url.api')}/testing-support/accounts`,
      {
        email: email,
        password: password,
        forename: forename,
        surname: testConfig.SUPER_ADMIN_CITIZEN_USER_LASTNAME,
        roles: codeUserRoles
      },
      {
        headers: {'Content-Type': 'application/json'},
      })).data;

  } catch (e) {
    throw new Error(`Failed to create user ${email} with roles ${userRoles}, http-status: ${e.response?.status}`);
  }
};

export const getAuthToken = async () => {
  const credentials = {
    username: testConfig.SMOKE_TEST_USER_USERNAME as string,
    password: testConfig.SMOKE_TEST_USER_PASSWORD as string
  };
  try {
    return (await axios.post(
      `${config.get('services.idam.url.api')}/loginUser`,
      new URLSearchParams(credentials)
    )).data.api_auth_token;
  } catch (e) {
    throw new Error(`Failed to get admin auth-token with ${credentials.username}:${credentials.password}, http-status: ${e.response?.status}`);
  }
};

export const retireStaleUser = async (userId) => {
  const authToken = await getAuthToken();
  try {
    await axios.post(
      `${config.get('services.idam.url.api')}/api/v1/staleUsers/${userId}/retire`,
      {},
      {
        headers: {'Authorization': 'AdminApiAuthToken ' + authToken},
      }
    );
  } catch (e) {
    throw new Error(`Failed to retire: ${userId}, http-status: ${e.response?.status}`);
  }
};

export const getOIDCToken = async () => {
  const credentials = {
    'grant_type': 'password',
    username: testConfig.SMOKE_TEST_USER_USERNAME as string,
    password: testConfig.SMOKE_TEST_USER_PASSWORD as string,
    'client_secret': config.get('services.idam.clientSecret') as string,
    'client_id': config.get('services.idam.clientID') as string,
    scope: config.get('services.idam.scope') as string

  };
  try {
    return (await axios.post(
      `${config.get('services.idam.url.api')}/o/token`,
      new URLSearchParams(credentials)
    )).data.access_token;
  } catch (e) {
    throw new Error(`Failed to get OIDCToken with ${credentials.username}:${credentials.password}, http-status: ${e.response?.status}`);
  }
};

export const suspendUser = async (userId) => {
  const OIDCToken = await getOIDCToken();
  try {
    await axios.patch(
      `${config.get('services.idam.url.api')}/api/v1/users/${userId}`,
      {
        active: 'false',
        forename: testConfig.suspendUser.firstName,
        surname: testConfig.SUPER_ADMIN_CITIZEN_USER_LASTNAME,
        email: testConfig.suspendUser.email
      },
      {
        headers: {'Authorization': 'Bearer ' + OIDCToken},
      }
    );
  } catch (e) {
    throw new Error(`Failed to suspend: ${userId}, http-status: ${e.response?.status}`);
  }
};


export const deleteUser = async (email) => {
  try {
    await axios.delete(
      `${config.get('services.idam.url.api')}/testing-support/accounts/${email}`
    );
  } catch (e) {
    throw new Error(`Failed to delete user with email ${email}, http-status: ${e.response?.status}`);
  }
};
