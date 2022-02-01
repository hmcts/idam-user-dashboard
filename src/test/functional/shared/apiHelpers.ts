import axios from 'axios';
import config from 'config';
import { config as testConfig } from '../../config';

export const createUserWithRoles = async(email, password, forename, userRoles) => {
  const codeUserRoles = userRoles.map(role => ({ code: role }));

  try {
    await axios.post(
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
      });

  } catch (e) {
    throw new Error(`Failed to create user ${email} with roles ${userRoles}, http-status: ${e.response.status}`);
  }
};

export const deleteUser = async(email) => {
  try {
    await axios.delete(
      `${config.get('services.idam.url.api')}/testing-support/accounts/${email}`
    );
  } catch (e) {
    throw new Error(`Failed to delete user with email ${email}, http-status: ${e.response.status}`);
  }
};
