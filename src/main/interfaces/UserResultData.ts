import {PageData} from './PageData';

export interface UserResultData extends PageData {
  search: string;
  result?: User;
}

export interface User {
  id: string;
  forename: string;
  surname: string;
  email: string;
  active: boolean;
  locked: boolean;
  pending: boolean;
  stale: boolean;
  roles: string[];
  ssoProvider: string;
  ssoId: string;
  lastModified: string;
  createDate: string;
}
