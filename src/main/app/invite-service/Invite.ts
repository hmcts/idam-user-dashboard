export enum InvitationTypes {
  INVITE = 'INVITE',
  APPOINT = 'APPOINT',
  SELF_REGISTER = 'SELF_REGISTER',
  REACTIVATE = 'REACTIVATE',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface Invite {
  email: string;
  forename: string;
  surname: string;
  activationRoleNames?: string[];
  invitedBy?: string;
  clientId?: string;
  successRedirect?: string;
}

export interface Invitation {
  id: string;
  invitationType: InvitationTypes;
  invitationStatus: InvitationStatus;
  userId: string;
  email: string;
  createDate: string;

  forename?: string;
  surname?: string;
  activationRoleNames?: string[];
  clientId?: string;
  successRedirect?: string;
  invitedBy?: string;
  lastModified?: string;
}