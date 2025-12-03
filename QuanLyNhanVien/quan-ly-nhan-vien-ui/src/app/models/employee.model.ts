export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: number;
    dateOfBirth: Date | string;
    salary: number;
    avatarUrl?: string;
    jobTitle?: string;
    phone?: string;
    address?: string;
}