import { V2Role } from '../interfaces/V2Role';
import { UserRoleAssignment } from '../interfaces/UserRoleAssignment';
import { V2User } from '../interfaces/V2User';
import { User } from '../interfaces/User';
import {AuthedRequest} from '../interfaces/AuthedRequest';
import {IdamAPI} from '../app/idam-api/IdamAPI';
import logger from '../modules/logging';

export const IDAM_MFA_DISABLED = 'idam-mfa-disabled';
export const CITIZEN_ROLE = 'citizen';
export const CASEWORKER_ROLE = 'caseworker';

export const loadUserAssignableRoles = (req: AuthedRequest, idamWrapper: IdamAPI) : Promise<void> => {
  if (!req.idam_user_dashboard_session.user.assignableRoles) {
    return idamWrapper.getAssignableRoles(req.idam_user_dashboard_session.user.roles)
      .then((assignableRoles: string[]) => {
        req.idam_user_dashboard_session.user.assignableRoles = assignableRoles;
      })
      .catch((err: any) => {
        logger.error('Failed to get assignable roles', err);
        throw err;
      });
  }
};

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

export const constructAllRoleAssignments = (allRoles: V2Role[], assignedRoleNames: string[]): UserRoleAssignment[] => {
  const userRoleAssignments: UserRoleAssignment[] = [];
  allRoles
    .map(roles => roles.name)
    .forEach(r => {
      const obj = {} as UserRoleAssignment;
      obj.name = r;
      obj.assignable = assignedRoleNames.includes(r);
      userRoleAssignments.push(obj);
    });
  userRoleAssignments.sort((a, b) => sortRolesByAssignableAndName(a, b));
  return userRoleAssignments;
};

export const constructUserRoleAssignments = (assignableRoleNames: string[], assignedRoleNames: string[]): UserRoleAssignment[] => {
  const userRoleAssignments: UserRoleAssignment[] = [];
  const combinedRoles = new Set<string>([...assignableRoleNames, ...assignedRoleNames]);

  combinedRoles.forEach(r => {
    const obj = {} as UserRoleAssignment;
    obj.name = r;
    obj.assignable = assignableRoleNames.includes(r);
    obj.assigned = assignedRoleNames.includes(r);
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

export const processRoleBasedAttributes = (user: User) => {
  // Set a specific field using the idam-mfa-disabled role and remove that role from the role list
  user.multiFactorAuthentication = !user.roles.includes(IDAM_MFA_DISABLED);
  if (!user.multiFactorAuthentication) {
    user.roles = user.roles.filter(r => r !== IDAM_MFA_DISABLED);
  }
  user.isCitizen = user.roles.includes(CITIZEN_ROLE);
  if (user.isCitizen) {
    user.roles = user.roles.filter(r => r !== CITIZEN_ROLE);
  }
};

export const rolesExist = (roleIds: string[], rolesMap: Map<string, V2Role>): boolean => {
  return roleIds.every(r => rolesMap.has(r));
};
