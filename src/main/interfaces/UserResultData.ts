import { PageData } from './PageData';
import { User } from './User';

export interface UserResultData extends PageData {
  search: string;
  result?: User;
}
