import {constructRoleAssignment} from '../../../../main/utils/roleUtils';
import {Role} from '../../../../main/interfaces/Role';

describe('utils', () => {
  describe('constructRoleAssignment', () => {
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
      const results = constructRoleAssignment(allRoles, [role2, role3]);
      expect(results[0]).toStrictEqual({name: 'role2', assignable: true});
      expect(results[1]).toStrictEqual({name: 'role3', assignable: true});
      expect(results[2]).toStrictEqual({name: 'role1', assignable: false});
    });

    test('Should set all assignable flags to false if no roles are assignable', async () => {
      const results = constructRoleAssignment(allRoles, []);
      expect(results[0].assignable).toBe(false);
      expect(results[1].assignable).toBe(false);
      expect(results[2].assignable).toBe(false);
    });
  });
});
