import * as TestingSupportAPI from '../testingSupportApi';
const Helper = require('@codeceptjs/helper');
type TestingSupportAPI = typeof TestingSupportAPI;

class TestingSupportApi extends Helper implements TestingSupportAPI {
  deleteStaleUser = TestingSupportAPI.deleteStaleUser
  deleteUser = TestingSupportAPI.deleteUser
  deleteAllTestData = TestingSupportAPI.deleteAllTestData;
  createUserWithRoles = TestingSupportAPI.createUserWithRoles
  createUserWithSsoId = TestingSupportAPI.createUserWithSsoId
  retireStaleUser = TestingSupportAPI.retireStaleUser
  suspendUser = TestingSupportAPI.suspendUser
  getUserDetails = TestingSupportAPI.getUserDetails
  createAssignableRoles = TestingSupportAPI.createAssignableRoles
  assignRolesToParentRole = TestingSupportAPI.assignRolesToParentRole
  extractUrlFromNotifyEmail = TestingSupportAPI.extractUrlFromNotifyEmail
  activateUserAccount =TestingSupportAPI.activateUserAccount
}

export = TestingSupportApi;
