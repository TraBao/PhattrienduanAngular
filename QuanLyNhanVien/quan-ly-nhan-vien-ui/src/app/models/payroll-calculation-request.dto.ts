export interface PayrollCalculationRequestDto {
    month: number;
    year: number;
    employeeInputs: EmployeePayrollInputDto[];
}

export interface EmployeePayrollInputDto {
    employeeId: number;
    overtimeHours: number;
    allowancesAmount: number;
    bonusesAmount: number;
}