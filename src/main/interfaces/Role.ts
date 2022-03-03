export interface Role {
  id: string;
  name: string;
  description: string;
  assignableRoles: string[];
  conflictingRoles: string[];
  assigned: boolean;
}
