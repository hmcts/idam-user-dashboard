import {
  constructAllRoleAssignments,
  constructUserRoleAssignments,
  processMfaRole, rolesExist
} from '../../../../main/utils/roleUtils';
import { Role } from '../../../../main/interfaces/Role';
import { User } from '../../../../main/interfaces/User';

describe('roleUtils', () => {
  describe('constructAllRoleAssignments', () => {
    const role1 = 'role1';
    const role2 = 'role2';
    const role3 = 'role3';

    const allRoles: Role[] = [
      {
        id: '1',
        name: role1,
        description: role1,
        assignableRoles: [role2],
        conflictingRoles: [],
        assigned: true
      },
      {
        id: '2',
        name: role2,
        description: role2,
        assignableRoles: [role3],
        conflictingRoles: [],
        assigned: true
      },
      {
        id: '3',
        name: role3,
        description: role3,
        assignableRoles: [],
        conflictingRoles: [],
        assigned: true
      }
    ];

    test('Should set assignable flags to true for assignable roles', async () => {
      const results = constructAllRoleAssignments(allRoles, [role2, role3]);
      expect(results[0]).toStrictEqual({name: 'role2', assignable: true});
      expect(results[1]).toStrictEqual({name: 'role3', assignable: true});
      expect(results[2]).toStrictEqual({name: 'role1', assignable: false});
    });

    test('Should set all assignable flags to false if no roles are assignable', async () => {
      const results = constructAllRoleAssignments(allRoles, []);
      expect(results[0].assignable).toBe(false);
      expect(results[1].assignable).toBe(false);
      expect(results[2].assignable).toBe(false);
    });
  });

  describe('constructUserRoleAssignments', () => {
    const role1 = 'role1';
    const role2 = 'role2';
    const role3 = 'role3';
    const role4 = 'role4';
    const role5 = 'role5';
    const role6 = 'role6';

    test('Should return all roles if assignable roles and assigned roles are different', async () => {
      const expectedResults = [
        {
          name: role1, assignable: true, assigned: false
        },
        {
          name: role2, assignable: true, assigned: false
        },
        {
          name: role3, assignable: true, assigned: false
        },
        {
          name: role4, assignable: false, assigned: true
        },
        {
          name: role5, assignable: false, assigned: true
        },
        {
          name: role6, assignable: false, assigned: true
        }
      ];

      const results = constructUserRoleAssignments([role1, role2, role3], [role4, role5, role6]);
      expect(results).toStrictEqual(expectedResults);
    });

    test('Should return roles with duplication removed if assignable roles and assigned roles overlap', async () => {
      const expectedResults = [
        {
          name: role1, assignable: true, assigned: true
        },
        {
          name: role2, assignable: true, assigned: false
        },
        {
          name: role3, assignable: true, assigned: true
        },
        {
          name: role5, assignable: false, assigned: true
        }
      ];

      const results = constructUserRoleAssignments([role1, role2, role3], [role5, role3, role1]);
      expect(results).toStrictEqual(expectedResults);
    });

    test('Should return all roles with assignable roles sorted first', async () => {
      const expectedResults = [
        {
          name: role2, assignable: true, assigned: false
        },
        {
          name: role4, assignable: true, assigned: true
        },
        {
          name: role1, assignable: false, assigned: true
        },
        {
          name: role3, assignable: false, assigned: true
        }
      ];

      const results = constructUserRoleAssignments([role2, role4], [role3, role1, role4]);
      expect(results).toStrictEqual(expectedResults);
    });
  });

  describe('processMfaRole', () => {
    const user: User = {
      id: '1',
      forename: 'John',
      surname: 'Smith',
      email: 'test@test.com',
      active: true,
      locked: false,
      pending: false,
      stale: false,
      ssoProvider: '',
      roles: [],
      ssoId: '',
      lastModified: '',
      createDate: ''
    };

    test('Should set multi-factor authentication flag if user does not have the idam-mfa-disabled role', async () => {
      user.roles = ['IDAM_SUPER_USER'];
      processMfaRole(user);
      expect(user.multiFactorAuthentication).toBeTruthy();
    });

    test('Should not set multi-factor authentication flag if user has the idam-mfa-disabled role', async () => {
      user.roles = ['IDAM_SUPER_USER', 'idam-mfa-disabled'];
      processMfaRole(user);
      expect(user.multiFactorAuthentication).toBeFalsy();
    });
  });

  describe('rolesExist', () => {
    const role1 = 'role1';
    const role2 = 'role2';
    const role3 = 'role3';
    const role4 = 'role4';
    const role5 = 'role5';

    const rolesMap = new Map<string, Role>([
      [role1, { id: role1, name: role1, description: role1, assignableRoles: [], conflictingRoles: [], assigned: false }],
      [role2, { id: role2, name: role2, description: role2, assignableRoles: [], conflictingRoles: [], assigned: false }],
      [role3, { id: role3, name: role3, description: role3, assignableRoles: [], conflictingRoles: [], assigned: false }]
    ]);

    test('Should return true if all role IDs exist in the roles map', async () => {
      expect(rolesExist([role1, role2, role3], rolesMap)).toBeTruthy();
    });

    test('Should return false if some role IDs exist in the roles map', async () => {
      expect(rolesExist([role1, role2, role4], rolesMap)).toBeFalsy();
    });

    test('Should return false if no role ID exists in the roles map', async () => {
      expect(rolesExist([role4, role5], rolesMap)).toBeFalsy();
    });
  });
});
