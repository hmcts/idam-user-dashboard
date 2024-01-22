import { AccessibilityStatementTest } from './steps/AccessibilityStatement';
import { ManageUserTest } from './steps/ManageUser';
import { AddUserDetailsTest } from './steps/AddUserDetails';
import { AddUserRolesTest } from './steps/AddUserRoles';
import { UserEditTest } from './steps/UserEdit';
import { UserDeleteTest } from './steps/UserDelete';
import { UserResultsTest } from './steps/UserResults';
import { UserSuspendTest } from './steps/UserSuspend';
import { UserSsoTest } from './steps/UserSso';
import { AddUserTest } from './steps/AddUser';
import { AddPrivateBetaServiceTest } from './steps/AddPrivateBetaService';
import { GenerateReportTest } from './steps/GenerateReport';
import { ViewReportTest } from './steps/ViewReport';
import { DownloadReportTest } from './steps/DownloadReport';

describe('Accessibility', () => {

  describe('AccessibilityStatementTest', () => {
    AccessibilityStatementTest();
  });

  describe('ManageUserTest', () => {
    ManageUserTest();
  });

  describe('AddUserDetailsTest', () => {
    AddUserDetailsTest();
  });

  describe('AddUserRolesTest', () => {
    AddUserRolesTest();
  });

  describe('UserEditTest', () => {
    UserEditTest();
  });

  describe('UserDeleteTest', () => {
    UserDeleteTest();
  });

  describe('UserResultsTest', () => {
    UserResultsTest();
  });

  describe('UserSuspendTest', () => {
    UserSuspendTest();
  });

  describe('UserSsoTest', () => {
    UserSsoTest();
  });

  describe('AddUserTest', () => {
    AddUserTest();
  });

  describe('AddPrivateBetaServiceTest', () => {
    AddPrivateBetaServiceTest();
  });

  describe('GenerateReportTest', () => {
    GenerateReportTest();
  });

  describe('ViewReportTest', () => {
    ViewReportTest();
  });

  describe('DownloadReportTest', () => {
    DownloadReportTest();
  });

});