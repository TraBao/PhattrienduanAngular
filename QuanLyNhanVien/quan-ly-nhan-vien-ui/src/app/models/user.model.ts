export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions?: string;
  lockoutEnd?: Date | string | null;
  isLinkedToEmployee: boolean; 
}