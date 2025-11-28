using System.ComponentModel.DataAnnotations;

namespace QuanLyNhanVien.Api.Models
{
    public class Payroll
    {
        [Key]
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;

        public int Month { get; set; }
        public int Year { get; set; }
        public decimal BasicSalary { get; set; }

        public double TotalWorkDays { get; set; }

        public decimal Bonus { get; set; } = 0;
        public decimal Deductions { get; set; } = 0;

        public decimal FinalSalary { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}