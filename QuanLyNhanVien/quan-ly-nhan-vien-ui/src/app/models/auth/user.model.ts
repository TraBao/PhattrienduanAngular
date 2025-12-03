export interface User {
    id: number;
    username: string;
    email: string;
    token?: string;
    roles: string[];
    firstName?: string;
    lastName?: string;
}