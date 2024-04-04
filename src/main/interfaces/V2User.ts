export interface V2User {
  id: string;
  forename: string;
  surname: string;
  email: string;
  displayName: string;
  roleNames: string[];
  ssoId?: string;
  ssoProvider?: string;
  accountStatus: AccountStatus;
  recordType: RecordType;
  createDate: string;
  lastModified?: string;
  accessLockedDate?: string;
  lastLoginDate?: string;
  assignableRoles?: string[];
  multiFactorAuthentication?: boolean;
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED'
}

export enum RecordType {
  LIVE = 'LIVE',
  ARCHIVED = 'ARCHIVED'
}
