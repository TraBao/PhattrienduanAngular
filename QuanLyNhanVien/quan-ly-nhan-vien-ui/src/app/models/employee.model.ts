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
    phoneNumber?: string;
    address?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    isLocked?: boolean;
    userId?: string;
}