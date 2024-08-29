import {IdamAPI} from '../../../main/app/idam-api/IdamAPI';

type Mocked<T> = { [P in keyof T]: jest.Mock; };

export const mockApi: Mocked<IdamAPI> = {
  searchUsersByEmail: jest.fn(),
  searchUsersBySsoId: jest.fn(),
  getUserById: jest.fn(),
  getUserV2ById: jest.fn(),
  editUserById: jest.fn(),
  deleteUserById: jest.fn(),
  removeSsoById: jest.fn(),
  registerUser: jest.fn(),
  getAllServices: jest.fn(),
  getAllV2Roles: jest.fn(),
  getAssignableRoles: jest.fn(),
  grantRolesToUser: jest.fn(),
  removeRoleFromUser: jest.fn(),
  getUsersWithRoles: jest.fn()
};
