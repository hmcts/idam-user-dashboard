import * as TestingSupportAPI from '../testingSupportApi';

const Helper = require('@codeceptjs/helper');
type TestingSupportAPI = typeof TestingSupportAPI;

class TestingSupportApi extends Helper implements TestingSupportAPI {
  deleteStaleUser = TestingSupportAPI.deleteStaleUser
  deleteUser = TestingSupportAPI.deleteUser
  deleteAllTestData = TestingSupportAPI.deleteAllTestData;
  createUserWithRoles = TestingSupportAPI.createUserWithRoles
  createUserWithSsoId = TestingSupportAPI.createUserWithSsoId
  createUserWithSsoProvider = TestingSupportAPI.createUserWithSsoProvider
  retireStaleUser = TestingSupportAPI.retireStaleUser
  suspendUser = TestingSupportAPI.suspendUser
  getUserDetails = TestingSupportAPI.getUserDetails
  createAssignableRoles = TestingSupportAPI.createAssignableRoles
  assignRolesToParentRole = TestingSupportAPI.assignRolesToParentRole
  extractUrlFromNotifyEmail = TestingSupportAPI.extractUrlFromNotifyEmail
  activateUserAccount = TestingSupportAPI.activateUserAccount
  getOIDCToken = TestingSupportAPI.getOIDCToken
  getTestingServiceClientToken = TestingSupportAPI.getTestingServiceClientToken
  createRoleFromTestingSupport = TestingSupportAPI.createRoleFromTestingSupport
  createServiceFromTestingSupport = TestingSupportAPI.createServiceFromTestingSupport;
  loginUsingPasswordGrant = TestingSupportAPI.loginUsingPasswordGrant
}

export = TestingSupportApi;
