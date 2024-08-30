export interface V2Role {
  id: string;
  name: string;
  description: string;
  assignableRoleNames: string[];
  assigned: boolean;
}