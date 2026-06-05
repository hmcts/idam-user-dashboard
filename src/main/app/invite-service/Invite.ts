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

interface InviteDetails {
  email: string;
  activationRoleNames?: string[];
  invitedBy?: string;
  clientId?: string;
  successRedirect?: string;
}

export interface Invite extends InviteDetails {
  forename: string;
  surname: string;
}

export interface Invitation extends InviteDetails {
  id: string;
  invitationType: InvitationTypes;
  invitationStatus: InvitationStatus;
  userId: string;
  createDate: string;

  forename?: string;
  surname?: string;
  lastModified?: string;
}