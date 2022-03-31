import {IdamAPI} from '../../../main/app/idam-api/IdamAPI';

type Mocked<T> = { [P in keyof T]: jest.Mock; };

export const mockApi: Mocked<IdamAPI> = {
  getUserById: jest.fn(),
  getUserDetails: jest.fn(),
  editUserById: jest.fn(),
  deleteUserById: jest.fn(),
  registerUser: jest.fn(),
  getAllServices: jest.fn(),
  getAllRoles: jest.fn(),
  getAssignableRoles: jest.fn(),
  grantRolesToUser: jest.fn(),
  removeRoleFromUser: jest.fn()
};
