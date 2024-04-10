import { Role } from '../interfaces/Role';
import { UserRoleAssignment } from '../interfaces/UserRoleAssignment';
import { V2User } from '../interfaces/V2User';
import { User } from '../interfaces/User';

export const IDAM_MFA_DISABLED = 'idam-mfa-disabled';

const sortRolesByName = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  } else {
    return a > b ? 1 : 0;
  }
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
    .sort((a, b) => sortRolesByAssignableAndName(a, b));
};

export const determineUserNonAssignableRoles = (assignableRoles: string[], assignedRoles: string[]): string[] => {
  const nonAssignableRoles = assignedRoles.filter(r => !assignableRoles.includes(r));
  return nonAssignableRoles;
};

export const processMfaRoleV2 = (user: V2User) => {
  // Set a specific field using the idam-mfa-disabled role and remove that role from the role list
  user.multiFactorAuthentication = !user.roleNames.includes(IDAM_MFA_DISABLED);
  if (!user.multiFactorAuthentication) {
    user.roleNames = user.roleNames.filter(r => r !== IDAM_MFA_DISABLED);
  }
};

export const processMfaRole = (user: User) => {
  // Set a specific field using the idam-mfa-disabled role and remove that role from the role list
  user.multiFactorAuthentication = !user.roles.includes(IDAM_MFA_DISABLED);
  if (!user.multiFactorAuthentication) {
    user.roles = user.roles.filter(r => r !== IDAM_MFA_DISABLED);
  }
};

export const rolesExist = (roleIds: string[], rolesMap: Map<string, Role>): boolean => {
  return roleIds.every(r => rolesMap.has(r));
};
