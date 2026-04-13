import { User } from './User';

export interface UsersWithRolesResponse {
  users: User[];
  hasNextPage: boolean;
}
