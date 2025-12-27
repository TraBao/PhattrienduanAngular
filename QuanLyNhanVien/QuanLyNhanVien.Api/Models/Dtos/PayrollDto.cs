namespace QuanLyNhanVien.Api.Dtos
{
    public class PayrollDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal BasicSalary { get; set; }
        public int ActualWorkDays { get; set; }
        public int PaidLeaveDays { get; set; }
        public decimal OvertimePay { get; set; }
        public decimal Allowances { get; set; }
        public decimal Bonuses { get; set; }
        public decimal GrossSalary { get; set; }
        public decimal SocialInsuranceDeduction { get; set; }
        public decimal HealthInsuranceDeduction { get; set; }
        public decimal UnemploymentInsuranceDeduction { get; set; }
        public decimal PersonalIncomeTaxDeduction { get; set; }
        public decimal TotalDeductions { get; set; }
        public decimal NetSalary { get; set; }
        public string Status { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankAccountName { get; set; }
    }
}