using System;
using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class Payroll
    {
        [Key]
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal BasicSalary { get; set; }
        public int ActualWorkDays { get; set; }
        public int PaidLeaveDays { get; set; }
        public decimal OvertimePay { get; set; } = 0;
        public decimal Allowances { get; set; } = 0;
        public decimal Bonuses { get; set; } = 0;
        public decimal GrossSalary { get; set; }
        public decimal SocialInsuranceDeduction { get; set; } = 0;
        public decimal HealthInsuranceDeduction { get; set; } = 0;
        public decimal UnemploymentInsuranceDeduction { get; set; } = 0;
        public decimal PersonalIncomeTaxDeduction { get; set; } = 0;
        public decimal TotalDeductions { get; set; }
        public decimal NetSalary { get; set; }

        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? PaymentDate { get; set; }
        public Employee? Employee { get; set; }
    }
}