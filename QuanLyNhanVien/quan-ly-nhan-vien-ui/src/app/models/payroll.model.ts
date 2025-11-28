export interface Payroll {
    id: number;
    employeeId: number;
    employeeName: string;
    month: number;
    year: number;
    basicSalary: number;
    totalWorkDays: number;
    finalSalary: number;
    status: string;
    createdAt: string;
}