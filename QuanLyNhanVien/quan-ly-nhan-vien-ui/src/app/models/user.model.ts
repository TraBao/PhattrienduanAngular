export interface User {
    id: string;
    email: string;
    roles: string[];
    permissions?: string;
    lockoutEnd?: Date | string | null;
    username: string;
    token: string;
}