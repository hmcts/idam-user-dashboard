import axios from 'axios';
import config from 'config';
import {config as testConfig} from '../../config';

const NotifyClient = require('notifications-node-client').NotifyClient;
let notifyClient: any = undefined;
if (testConfig.NOTIFY_API_KEY) {
  notifyClient = new NotifyClient(testConfig.NOTIFY_API_KEY);
}
//max notify results pages to search
const MAX_NOTIFY_PAGES = 3;

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
    throw new Error(`Failed to get OIDCToken with ${credentials.username}:${credentials.password}, http-status: ${e.response?.status}`);
  }
};

export const createUserWithRoles = async (email: string, password: string, forename: string, userRoles: string[]) => {
  const codeUserRoles = userRoles.map(role => ({code: role}));

  try {
    return (await axios.post(
      `${config.get('services.idam.url.api')}/testing-support/accounts`,
      {
        email: email,
        id: email,
        password: password,
        forename: forename,
        surname: testConfig.USER_LASTNAME,
        roles: codeUserRoles
      },
      {
        headers: {'Content-Type': 'application/json'},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create user ${email} with roles ${userRoles}, http-status: ${e.response?.status}`);
  }
};

export const createUserWithSsoId = async (email: string, password: string, forename: string, userRoles: string[], ssoId: string) => {
  const codeUserRoles = userRoles.map(role => ({code: role}));

  try {
    return (await axios.post(
      `${config.get('services.idam.url.api')}/testing-support/accounts`,
      {
        email: email,
        password: password,
        forename: forename,
        surname: testConfig.USER_LASTNAME,
        ssoProvider: testConfig.SSO_PROVIDER,
        ssoId: ssoId,
        roles: codeUserRoles
      },
      {
        headers: {'Content-Type': 'application/json'},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create user ${email} with ssoId ${ssoId}, http-status: ${e.response?.status}`);
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

export const suspendUser = async (userId: string, email: string) => {
  const OIDCToken = await getOIDCToken();
  try {
    await axios.patch(
      `${config.get('services.idam.url.api')}/api/v1/users/${userId}`,
      {
        active: 'false',
        forename: testConfig.USER_FIRSTNAME,
        surname: testConfig.USER_LASTNAME,
        email: email
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

export const createAssignableRoles = async (roleName: string) => {
  try {
    const authToken = await getAuthToken();
    return (await axios.post(
      `${config.get('services.idam.url.api')}/roles`,
      {
        assignableRoles: [null],
        conflictingRoles: [null],
        description: 'assignable role',
        id: roleName,
        name: roleName
      },
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'AdminApiAuthToken ' + authToken},
      })).data;
  } catch (e) {
    throw new Error(`Failed to create assignable role ${roleName}, http-status: ${e.response?.status}`);
  }
};

export const assignRolesToParentRole = async (parentRoleId: string, assignableRoleIds: string[]) => {
  try {
    const authToken = await getAuthToken();
    return (await axios.put(
      `${config.get('services.idam.url.api')}/roles/${parentRoleId}/assignableRoles`,
      assignableRoleIds,
      {
        headers: {'Content-Type': 'application/json', 'Authorization': 'AdminApiAuthToken ' + authToken},
      }));
  } catch (e) {
    throw new Error(`Failed to assign roles ${assignableRoleIds} to parent role ${parentRoleId}, http-status: ${e.response?.status}`);
  }
};

const searchForEmailInNotifyResults = async (notifications: any, searchEmail: string) => {
  const result = notifications.find((currentItem: any) => {
    if (currentItem.email_address === searchEmail) {
      return true;
    }
    return false;
  });
  return result;
};

export const extractUrlFromNotifyEmail = async (searchEmail: string) => {
  let url;
  let notificationsResponse = await notifyClient.getNotifications('email', null);
  let emailResponse = await searchForEmailInNotifyResults(notificationsResponse.body.notifications, searchEmail);
  let i = 1;
  while (i < MAX_NOTIFY_PAGES && !emailResponse && notificationsResponse.body.links.next) {
    const nextPageLink = notificationsResponse.body.links.next;
    const nextPageLinkUrl = new URL(nextPageLink);
    const olderThanId = nextPageLinkUrl.searchParams.get('older_than');
    notificationsResponse = await notifyClient.getNotifications('email', null, null, olderThanId);
    emailResponse = await searchForEmailInNotifyResults(notificationsResponse.body.notifications, searchEmail);
    i++;
  }
  const regex = '(https.+)';
  const urlMatch = emailResponse.body.match(regex);
  if (urlMatch[0]) {
    url = urlMatch[0];
  }
  return url;
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


