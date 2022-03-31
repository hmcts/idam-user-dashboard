
import { Role } from '../interfaces/Role';
import {UserRoleAssignment} from '../interfaces/UserRoleAssignment';

const sortRolesByName = (a: string, b: string): number => {
  return a < b ? -1 : a > b ? 1 : 0;
};

const sortRolesByAssignableAndName = (a: UserRoleAssignment, b: UserRoleAssignment): number => {
  if (a.assignable && !b.assignable) {
    return -1;
  } else if (b.assignable && !a.assignable) {
    return 1;
  }
  return sortRolesByName(a.name.toLowerCase(), b.name.toLowerCase());
};

export const constructAllRoleAssignments = (allRoles: Role[], assignableRoles: string[]): UserRoleAssignment[] => {
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

export const constructUserRoleAssignments = (assignableRoles: string[], assignedRoles: string[]): UserRoleAssignment[] => {
  const userRoleAssignments: UserRoleAssignment[] = [];
  const combinedRoles = [];
  combinedRoles.push(...assignableRoles, ...assignedRoles);

  combinedRoles.forEach(r => {
    const obj = {} as UserRoleAssignment;
    obj.name = r;
    obj.assignable = assignableRoles.includes(r);
    obj.assigned = assignedRoles.includes(r);
    userRoleAssignments.push(obj);
  });

  return [...new Map(userRoleAssignments.map(item => [item.name, item])).values()]
    .sort((a, b) => sortRolesByName(a.name.toLowerCase(), b.name.toLowerCase()));
};

export const determineUserNonAssignableRoles = (assignableRoles: string[], assignedRoles: string[]): string[] => {
  const nonAssignableRoles = assignedRoles.filter(r => !assignableRoles.includes(r));
  return nonAssignableRoles;
};
