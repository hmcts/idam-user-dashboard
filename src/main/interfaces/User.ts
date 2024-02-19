export interface User {
  uid: string;
  id: string;
  forename: string;
  surname: string;
  email: string;
  active: boolean;
  locked: boolean;
  pending: boolean;
  stale: boolean;
  pwdAccountLockedTime?: string;
  roles: string[];
  ssoProvider: string;
  ssoId: string;
  lastModified: string;
  createDate: string;
  assignableRoles?: string[];
  multiFactorAuthentication?: boolean;
}
