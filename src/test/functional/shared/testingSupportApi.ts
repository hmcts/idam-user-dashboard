import axios from 'axios';
import config from 'config';
import {config as testConfig} from '../../config';
import {v4 as uuid} from 'uuid';
console.debug(`***********services.idam.url.testingSupportApi ******** ${config.get('services.idam.url.testingSupportApi')}`);
console.debug(`*******services.idam.url.api**************: ${config.get('services.idam.url.api')}`);
const getAuthToken = async () => {
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
    throw new Error(`Failed to get OIDCToken using ${credentials} from ${config.get('services.idam.url.api')}, http-status: ${e.response?.status}`);
  }
};

export const createUserWithRoles = async (email: string, password: string, forename: string, userRoles: string[]) => {
  const userId = uuid();
  const OIDCToken = await getOIDCToken();
  try {
    return (await axios.post(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/users`,
      {
        activationSecretPhrase: password,
        user: {
          id: userId,
          email: email,
          forename: forename,
          surname: testConfig.USER_LASTNAME,
          displayName: forename + ' ' + testConfig.USER_LASTNAME,
          roleNames: userRoles,
        }
      },
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OIDCToken},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create user ${email} with roles ${userRoles}, http-status: ${e.response?.status}`);
  }
};

export const createUserWithSsoId = async (email: string, password: string, forename: string, userRoles: string[], ssoId: string) => {
  const userId = uuid();
  const OIDCToken = await getOIDCToken();
  try {
    return (await axios.post(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/users`,
      {
        activationSecretPhrase: password,
        user: {
          id: userId,
          email: email,
          forename: forename,
          surname: testConfig.USER_LASTNAME,
          displayName: forename + ' ' + testConfig.USER_LASTNAME,
          roleNames: userRoles,
          ssoId: ssoId,
          ssoProvider: testConfig.SSO_PROVIDER
        }
      },
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OIDCToken},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create user ${email} with ssoId ${ssoId}, http-status: ${e.response?.status}`);
  }
};

export const createUserWithSsoProvider = async (email: string, password: string, forename: string, userRoles: string[], ssoProvider: string) => {
  const userId = uuid();
  const OIDCToken = await getOIDCToken();
  try {
    return (await axios.post(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/users`,
      {
        activationSecretPhrase: password,
        user: {
          id: userId,
          email: email,
          forename: forename,
          surname: testConfig.USER_LASTNAME,
          displayName: forename + ' ' + testConfig.USER_LASTNAME,
          roleNames: userRoles,
          ssoId: testConfig.SSO_ID,
          ssoProvider: ssoProvider
        }
      },
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OIDCToken},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create user ${email} with ssoProvider ${ssoProvider}, http-status: ${e.response?.status}`);
  }
};

export const retireStaleUser = async (userId: string) => {
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

export const deleteStaleUser = async (userId: string) => {
  const authToken = await getAuthToken();
  try {
    await axios.delete(
      `${config.get('services.idam.url.api')}/api/v1/staleUsers/${userId}`,
      {
        headers: {'Authorization': 'AdminApiAuthToken ' + authToken},
      }
    );
  } catch (e) {
    throw new Error(`Failed to delete stale user: ${userId}, http-status: ${e.response?.status}`);
  }
};

export const suspendUser = async (userId: string) => {
  const OIDCToken = await getOIDCToken();
  try {
    await axios.patch(
      `${config.get('services.idam.url.api')}/api/v1/users/${userId}`,
      {
        active: false
      },
      {
        headers: {'Authorization': 'Bearer ' + OIDCToken},
      }
    );
  } catch (e) {
    throw new Error(`Failed to suspend: ${userId}, http-status: ${e.response?.status}`);
  }
};

export const getUserDetails = async (email: string) => {
  const OIDCToken = await getOIDCToken();
  try {
    return (await axios.get(
      `${config.get('services.idam.url.api')}/api/v1/users?query=email:${email}`,
      {
        headers: {'Authorization': 'Bearer ' + OIDCToken},
      }
    )).data;
  } catch (e) {
    throw new Error(`Failed to get user deatils for ${email}, http-status: ${e.response?.status}`);
  }
};

export const deleteUser = async (email: string) => {
  try {
    await axios.delete(
      `${config.get('services.idam.url.api')}/testing-support/accounts/${email}`
    );
  } catch (e) {
    throw new Error(`Failed to delete user with email ${email}, http-status: ${e.response?.status}`);
  }
};

export const deleteAllTestData = async (testDataPrefix = '', userNames: string[] = [], roleNames: string[] = [], serviceNames: string[] = [], async = true) => {
  try {
    await axios.delete(
      `${config.get('services.idam.url.api')}/testing-support/test-data?async=${async}&userNames=${userNames.join(',')}&roleNames=${roleNames.join(',')}&testDataPrefix=${testDataPrefix}&serviceNames=${serviceNames.join(',')}`
    );
  } catch (e) {
    throw new Error(`Error deleting test data with prefix  ${testDataPrefix}, response ${e.response?.status}`);
  }
};

export const extractUrlFromNotifyEmail = async (searchEmail: string) => {
  const OIDCToken = await getOIDCToken();
  try {
    return (await axios.get(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/notifications/latest/${searchEmail}`,
      {
        headers: {'Authorization': 'Bearer ' + OIDCToken},
      }
    )).data;
  } catch (e) {
    throw new Error(`Failed to extract email from Notify for ${searchEmail}, http-status: ${e.response?.status}`);
  }
};

export const activateUserAccount = async (code: string, token: string) => {
  const data = {
    code: code,
    password: testConfig.PASSWORD,
    token: token
  };
  try {
    await axios.patch(
      `${config.get('services.idam.url.api')}/activate`,
      JSON.stringify(data),
      {
        headers: {'Content-Type': 'application/json'},
      }
    );
  } catch (e) {
    throw new Error(`Failed to activate user, http-status: ${e.response?.status}`);
  }
};
//used to cache the testing service client token
let testingServiceClientToken: string | null = null;
export const getTestingServiceClientToken = async () => {
  if (testingServiceClientToken) {
    return testingServiceClientToken;
  }

  const credentials = {
    'grant_type': 'client_credentials',
    'client_secret': testConfig.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET as string,
    'client_id': testConfig.FUNCTIONAL_TEST_SERVICE_CLIENT_ID as string,
    'scope': 'profile'
  };

  try {
    const response = await axios.post(
      `${config.get('services.idam.url.api')}/o/token`,
      new URLSearchParams(credentials)
    );

    testingServiceClientToken = response.data.access_token;
    return testingServiceClientToken;
  } catch (e) {
    throw new Error(`Failed to getTestingServiceClientToken with ${credentials.client_id}:${credentials.client_secret}, http-status: ${e.response?.status}`);
  }
};

export const createRoleFromTestingSupport = async (roleName: string,assignableRoleNames: string[] ) => {

  const accessToken = await getTestingServiceClientToken();
  try {
    const role = {
      name: roleName,
      id: roleName,
      description: 'assignable role',
      assignableRoleNames: assignableRoleNames,
    };

    return (await axios.post(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/roles`,
      role,
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken},
      })).data;
  } catch (e) {
    throw new Error(`Failed to createRoleFromTestingSupport endpoint  ${roleName}, http-status: ${e.response?.status}`);
  }
};

export const createServiceFromTestingSupport = async (label: string, description: string, clientId: string, clientSecret: string, redirectUris: string[], onboardingRoles: string[]) => {
  const data = {
    clientId: clientId,
    clientSecret: clientSecret,
    serviceLabel: label,
    description: description,
    hmctsAccess : {
      mfaRequired : true,
      selfRegistrationAllowed : true,
      postActivationRedirectUrl : 'http://postactivation',
      onboardingRoleNames : onboardingRoles
    },
    oauth2: {
      redirectUris: redirectUris,
      scopes: ['openid', 'profile', 'roles'],

    }
  };
  try {
    const bearerToken = await getTestingServiceClientToken();
    return (await axios.post(
      `${config.get('services.idam.url.testingSupportApi')}/test/idam/services`,
      data,
      {headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bearerToken}}
    ));
  } catch (e) {
    throw new Error(`Failed to create new service ${label}, http-status: ${e.response?.status}`);
  }
};

export const loginUsingPasswordGrant = async (username: string, pass: string) => {
  const credentials = {
    'grant_type': 'password',
    username: username,
    password: pass,
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
    console.error(e.response);
  }
};

