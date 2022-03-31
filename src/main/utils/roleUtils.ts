
import { Role } from '../interfaces/Role';
import {UserRoleAssignment} from '../interfaces/UserRoleAssignment';

const sortRolesByAssignableAndName = (a: UserRoleAssignment, b: UserRoleAssignment): number => {
  if (a.assignable && !b.assignable) {
    return -1;
  } else if (b.assignable && !a.assignable) {
    return 1;
  }
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
};

export const constructRoleAssignment = (allRoles: Role[], assignableRoles: string[]): UserRoleAssignment[] => {
  const userRoleAssignments: UserRoleAssignment[] = [];
  allRoles
    .map(roles => roles.name)
    .forEach(r => {
      const obj = {} as UserRoleAssignment;
      obj.name = r;
      obj.assignable = assignableRoles.includes(r);
      userRoleAssignments.push(obj);
    });
  userRoleAssignments.sort((a, b) => sortRolesByAssignableAndName(a, b));
  return userRoleAssignments;
};
