import {IdamAPI} from '../../../main/app/idam-api/IdamAPI';

type Mocked<T> = { [P in keyof T]: jest.Mock; };

export const mockApi: Mocked<IdamAPI> = {
  searchUsersByEmail: jest.fn(),
  searchUsersBySsoId: jest.fn(),
  getUserById: jest.fn(),
  editUserById: jest.fn(),
  deleteUserById: jest.fn(),
  registerUser: jest.fn(),
  getAllServices: jest.fn(),
  getAllRoles: jest.fn(),
  getAssignableRoles: jest.fn(),
  grantRolesToUser: jest.fn(),
  removeRoleFromUser: jest.fn(),
  getUsersWithRoles: jest.fn()
};
