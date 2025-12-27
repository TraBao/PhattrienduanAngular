import { Employee } from './employee.model';

export interface Payroll {
    id: number;
    employeeId: number;
    employeeName: string;
    month: number;
    year: number;
    basicSalary: number;
    actualWorkDays: number;
    paidLeaveDays: number;
    overtimePay: number;
    allowances: number;
    bonuses: number;
    grossSalary: number;
    socialInsuranceDeduction: number;
    healthInsuranceDeduction: number;
    unemploymentInsuranceDeduction: number;
    personalIncomeTaxDeduction: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    createdAt: string;
    paymentDate?: string;
    employee?: Employee;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
}