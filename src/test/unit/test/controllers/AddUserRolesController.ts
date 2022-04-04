import {when} from 'jest-when';
import * as urls from '../../../../main/utils/urls';
import { mockResponse } from '../../utils/mockResponse';
import { AddUserRolesController } from '../../../../main/controllers/AddUserRolesController';
import { mockRequest } from '../../utils/mockRequest';
import {MISSING_ROLE_ASSIGNMENT_ERROR} from '../../../../main/utils/error';
import {mockApi} from '../../utils/mockApi';

describe('Add user roles controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddUserRolesController();

  const email = 'test@test.com';
  const forename = 'test';
  const surname = 'test';
  const role = 'test_role';
  const roleArray = ['test_role1', 'test_role2'];

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the add user completion page when assigning the user with a single role', async () => {
    const userRegistrationDetails = {
      email: email,
      firstName: forename,
      lastName: surname,
      roles: role
    };

    when(mockApi.registerUser).calledWith(userRegistrationDetails).mockReturnValue({});

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body.roles = role;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion', { urls });
  });

  test('Should render the add user completion page when assigning the user with multiple roles', async () => {
    const userRegistrationDetails = {
      email: email,
      firstName: forename,
      lastName: surname,
      roles: roleArray
    };

    when(mockApi.registerUser).calledWith(userRegistrationDetails).mockReturnValue({});

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body.roles = roleArray;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion', { urls });
  });

  test('Should render the add user roles page with error when no role assigned to the user', async () => {
    const role1 = 'role1';
    const role2 = 'role2';

    const allRoles = [
      {
        id: 1,
        name: role1,
        description: role1,
        assigned: false
      },
      {
        id: 2,
        name: role2,
        description: role2,
        assigned: false
      }
    ];

    when(mockApi.getAllRoles).calledWith().mockReturnValue(allRoles);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.session = { user: { assignableRoles: [role2] } };

    const expectedRoleAssignment = { roles: [
      {
        name: 'role2',
        assignable: true
      },
      {
        name: 'role1',
        assignable: false
      }]};

    const expectedError = { roles: {
      message: MISSING_ROLE_ASSIGNMENT_ERROR
    }};

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-roles', {
      content: expectedRoleAssignment,
      error: expectedError,
      urls,
      user: { assignableRoles: [role2] }
    });
  });
});
