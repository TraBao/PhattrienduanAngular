using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;
using ClosedXML.Excel;
using System.IO;
using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Hubs;
using QuanLyNhanVien.Api.Dtos;
using QuanLyNhanVien.Api.Filters;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PayrollController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private const decimal STANDARD_WORK_DAYS_IN_MONTH = 26.0m;
        private const decimal STANDARD_WORK_HOURS_PER_DAY = 8.0m;
        private const decimal OVERTIME_RATE = 1.5m;
        private const decimal PERSONAL_DEDUCTION = 11000000m;
        private const decimal DEPENDENT_DEDUCTION = 4400000m;
        private const decimal BHXH_RATE = 0.08m;
        private const decimal BHYT_RATE = 0.015m;
        private const decimal BHTN_RATE = 0.01m;

        public PayrollController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email")
                ?? User.FindFirstValue("sub")
                ?? string.Empty;
        }

        private bool IsAdmin() => User.IsInRole("Admin");
        private bool HasPermission(string p) => User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(p));

        [HttpPost("calculate")]
        [LogActivity("Tính lương tháng cho nhân viên")]
        public async Task<IActionResult> CalculatePayroll([FromBody] PayrollCalculationRequestDto request)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_PAYROLL")) return Forbid();
            var exists = await _context.Payrolls.AnyAsync(p => p.Month == request.Month && p.Year == request.Year);
            if (exists) return BadRequest(new { Message = $"Bảng lương tháng {request.Month}/{request.Year} đã tồn tại!" });

            var employees = await _context.Employees.Include(e => e.Department).ToListAsync();
            var payrolls = new List<Payroll>();

            foreach (var emp in employees)
            {
                var input = request.EmployeeInputs.FirstOrDefault(ei => ei.EmployeeId == emp.Id);
                decimal hourlyRate = emp.Salary / (STANDARD_WORK_DAYS_IN_MONTH * STANDARD_WORK_HOURS_PER_DAY);
                var actualWorkDays = await _context.Attendances
                    .Where(a => a.UserId == emp.Email && a.Date.Month == request.Month && a.Date.Year == request.Year)
                    .CountAsync();

                var paidLeaveDaysDouble = await _context.LeaveRequests
                    .Where(r => r.EmployeeId == emp.Id && r.Status == "Approved" && r.LeaveType == "Annual" &&
                                r.StartDate.Month == request.Month && r.StartDate.Year == request.Year)
                    .SumAsync(r => r.TotalDays);

                decimal paidLeaveDays = (decimal)paidLeaveDaysDouble;
                decimal dailyRate = emp.Salary / STANDARD_WORK_DAYS_IN_MONTH;
                decimal baseIncome = dailyRate * (actualWorkDays + paidLeaveDays);
                decimal overtimeHours = input?.OvertimeHours ?? 0;
                decimal overtimePay = hourlyRate * overtimeHours * OVERTIME_RATE;
                decimal allowances = input?.AllowancesAmount ?? 0m;
                decimal bonuses = input?.BonusesAmount ?? 0m;

                decimal grossSalary = baseIncome + overtimePay + allowances + bonuses;
                decimal bhxh = Math.Round(emp.Salary * BHXH_RATE, 0);
                decimal bhyt = Math.Round(emp.Salary * BHYT_RATE, 0);
                decimal bhtn = Math.Round(emp.Salary * BHTN_RATE, 0);
                decimal totalInsurance = bhxh + bhyt + bhtn;
                decimal incomeForTax = grossSalary - totalInsurance;
                decimal personalDed = emp.PersonalDeduction ?? PERSONAL_DEDUCTION;
                decimal dependentDed = (emp.NumberOfDependents ?? 0) * DEPENDENT_DEDUCTION;

                decimal taxableIncome = incomeForTax - personalDed - dependentDed;
                taxableIncome = Math.Max(0, taxableIncome);

                decimal tax = CalculatePersonalIncomeTax(taxableIncome);
                decimal totalDeductions = totalInsurance + tax;
                decimal netSalary = Math.Max(0, Math.Round(grossSalary - totalDeductions, 0));

                var payroll = new Payroll
                {
                    EmployeeId = emp.Id,
                    EmployeeName = $"{emp.LastName} {emp.FirstName}",
                    Month = request.Month,
                    Year = request.Year,
                    BasicSalary = emp.Salary,
                    ActualWorkDays = actualWorkDays,
                    PaidLeaveDays = (int)paidLeaveDays,
                    OvertimePay = Math.Round(overtimePay, 0),
                    Allowances = allowances,
                    Bonuses = bonuses,
                    GrossSalary = Math.Round(grossSalary, 0),
                    SocialInsuranceDeduction = bhxh,
                    HealthInsuranceDeduction = bhyt,
                    UnemploymentInsuranceDeduction = bhtn,
                    PersonalIncomeTaxDeduction = tax,
                    TotalDeductions = Math.Round(totalDeductions, 0),
                    NetSalary = netSalary,
                    Status = "Pending",
                    CreatedAt = DateTime.Now
                };
                payrolls.Add(payroll);
            }

            _context.Payrolls.AddRange(payrolls);
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Đã quyết toán lương cho {payrolls.Count} nhân viên.", Data = payrolls });
        }
        private decimal CalculatePersonalIncomeTax(decimal taxableIncome)
        {
            if (taxableIncome <= 0) return 0;
            if (taxableIncome <= 5000000)
                return taxableIncome * 0.05m;
            if (taxableIncome <= 10000000)
                return (taxableIncome * 0.10m) - 250000;
            if (taxableIncome <= 18000000)
                return (taxableIncome * 0.15m) - 750000;
            if (taxableIncome <= 32000000)
                return (taxableIncome * 0.20m) - 1650000;
            if (taxableIncome <= 52000000)
                return (taxableIncome * 0.25m) - 3250000;
            if (taxableIncome <= 80000000)
                return (taxableIncome * 0.30m) - 5850000;
            return (taxableIncome * 0.35m) - 9850000;
        }
        [HttpPut("{id}/details")]
        [LogActivity("Cập nhật chi tiết lương nhân viên")]
        public async Task<IActionResult> UpdatePayrollDetails(int id, [FromBody] UpdatePayrollDto input)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_PAYROLL")) return Forbid();

            var payroll = await _context.Payrolls.Include(p => p.Employee).FirstOrDefaultAsync(p => p.Id == id);
            if (payroll == null) return NotFound("Không tìm thấy bảng lương.");
            if (payroll.Status == "Paid") return BadRequest("Không thể sửa bảng lương đã thanh toán.");
            decimal hourlyRate = payroll.BasicSalary / (STANDARD_WORK_DAYS_IN_MONTH * STANDARD_WORK_HOURS_PER_DAY);
            decimal newOvertimePay = hourlyRate * input.OvertimeHours * OVERTIME_RATE;
            payroll.OvertimePay = Math.Round(newOvertimePay, 0);
            payroll.Allowances = input.AllowancesAmount;
            payroll.Bonuses = input.BonusesAmount;

            decimal dailyRate = payroll.BasicSalary / STANDARD_WORK_DAYS_IN_MONTH;
            decimal baseIncome = dailyRate * (payroll.ActualWorkDays + payroll.PaidLeaveDays);

            payroll.GrossSalary = Math.Round(baseIncome + payroll.OvertimePay + payroll.Allowances + payroll.Bonuses, 0);

            decimal totalInsurance = payroll.SocialInsuranceDeduction + payroll.HealthInsuranceDeduction + payroll.UnemploymentInsuranceDeduction;
            decimal incomeForTax = payroll.GrossSalary - totalInsurance;
            decimal personalDed = payroll.Employee?.PersonalDeduction ?? PERSONAL_DEDUCTION;
            decimal dependentDed = (payroll.Employee?.NumberOfDependents ?? 0) * DEPENDENT_DEDUCTION;

            decimal taxableIncome = Math.Max(0, incomeForTax - personalDed - dependentDed);
            payroll.PersonalIncomeTaxDeduction = Math.Round(CalculatePersonalIncomeTax(taxableIncome), 0);

            payroll.TotalDeductions = totalInsurance + payroll.PersonalIncomeTaxDeduction;
            decimal netResult = payroll.GrossSalary - payroll.TotalDeductions;
            payroll.NetSalary = Math.Max(0, Math.Round(netResult, 0));

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật thành công", Data = payroll });
        }

        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyPayroll([FromQuery] int month, [FromQuery] int year)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_PAYROLL")) return Forbid();
            var list = await _context.Payrolls
                .Include(p => p.Employee)
                .Where(p => p.Month == month && p.Year == year)
                .Select(p => new PayrollDto
                {
                    Id = p.Id,
                    EmployeeId = p.EmployeeId,
                    EmployeeName = p.EmployeeName,
                    Month = p.Month,
                    Year = p.Year,
                    BasicSalary = p.BasicSalary,
                    ActualWorkDays = p.ActualWorkDays,
                    PaidLeaveDays = p.PaidLeaveDays,
                    OvertimePay = p.OvertimePay,
                    Allowances = p.Allowances,
                    Bonuses = p.Bonuses,
                    GrossSalary = p.GrossSalary,
                    SocialInsuranceDeduction = p.SocialInsuranceDeduction,
                    HealthInsuranceDeduction = p.HealthInsuranceDeduction,
                    UnemploymentInsuranceDeduction = p.UnemploymentInsuranceDeduction,
                    PersonalIncomeTaxDeduction = p.PersonalIncomeTaxDeduction,
                    TotalDeductions = p.TotalDeductions,
                    NetSalary = p.NetSalary,
                    Status = p.Status,
                    BankName = p.Employee.BankName,
                    BankAccountNumber = p.Employee.BankAccountNumber,
                    BankAccountName = p.Employee.BankAccountName
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("mark-paid/{id}")]
        [LogActivity("Xác nhận thanh toán lương")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_PAYROLL")) return Forbid();
            var payroll = await _context.Payrolls.FindAsync(id);
            if (payroll == null) return NotFound();
            if (payroll.Status == "Paid") return BadRequest(new { Message = "Bảng lương này đã được thanh toán rồi." });

            payroll.Status = "Paid";
            payroll.PaymentDate = DateTime.Now;
            await _context.SaveChangesAsync();
            var employee = await _context.Employees.FindAsync(payroll.EmployeeId);
            if (employee != null)
            {
                var noti = new Notification
                {
                    RecipientIdentifier = employee.Email!,
                    Type = "Payroll",
                    Title = $"Đã thanh toán lương tháng {payroll.Month}/{payroll.Year}",
                    Message = $"Thực lĩnh: {payroll.NetSalary:N0} VNĐ.",
                    CreatedAt = DateTime.Now,
                    IsRead = false
                };
                _context.Notifications.Add(noti);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.Group($"User_{employee.Email}").SendAsync("ReceiveNotification", noti);
            }
            return Ok(new { Message = "Đã xác nhận thanh toán." });
        }

        [HttpGet("my-payslips")]
        public async Task<IActionResult> GetMyPayslips()
        {
            var email = GetCurrentUserEmail();
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);
            if (employee == null) return BadRequest("Tài khoản chưa liên kết hồ sơ.");
            var payslips = await _context.Payrolls.Where(p => p.EmployeeId == employee.Id)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month).ToListAsync();
            return Ok(payslips);
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportPayroll([FromQuery] int month, [FromQuery] int year)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_PAYROLL")) return Forbid();

            var payrolls = await _context.Payrolls
                .Where(p => p.Month == month && p.Year == year)
                .ToListAsync();

            if (payrolls.Count == 0) return NotFound("Chưa có dữ liệu.");

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Bang Luong");
                worksheet.Cell(1, 1).Value = "ID";
                worksheet.Cell(1, 2).Value = "Họ và Tên";
                worksheet.Cell(1, 3).Value = "Lương Cơ bản";
                worksheet.Cell(1, 4).Value = "Ngày Công";
                worksheet.Cell(1, 5).Value = "Ngày Phép";
                worksheet.Cell(1, 6).Value = "Tăng Ca";
                worksheet.Cell(1, 7).Value = "Phụ Cấp";
                worksheet.Cell(1, 8).Value = "Thưởng";
                worksheet.Cell(1, 9).Value = "Tổng Thu Nhập (Gross)";
                worksheet.Cell(1, 10).Value = "BHXH";
                worksheet.Cell(1, 11).Value = "BHYT";
                worksheet.Cell(1, 12).Value = "BHTN";
                worksheet.Cell(1, 13).Value = "Thuế TNCN";
                worksheet.Cell(1, 14).Value = "Tổng Khấu Trừ";
                worksheet.Cell(1, 15).Value = "Thực Lĩnh";
                worksheet.Cell(1, 16).Value = "Trạng thái";

                var headerRange = worksheet.Range("A1:P1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

                int row = 2;
                foreach (var item in payrolls)
                {
                    worksheet.Cell(row, 1).Value = item.EmployeeId;
                    worksheet.Cell(row, 2).Value = item.EmployeeName;
                    worksheet.Cell(row, 3).Value = item.BasicSalary;
                    worksheet.Cell(row, 4).Value = item.ActualWorkDays;
                    worksheet.Cell(row, 5).Value = item.PaidLeaveDays;
                    worksheet.Cell(row, 6).Value = item.OvertimePay;
                    worksheet.Cell(row, 7).Value = item.Allowances;
                    worksheet.Cell(row, 8).Value = item.Bonuses;
                    worksheet.Cell(row, 9).Value = item.GrossSalary;
                    worksheet.Cell(row, 10).Value = item.SocialInsuranceDeduction;
                    worksheet.Cell(row, 11).Value = item.HealthInsuranceDeduction;
                    worksheet.Cell(row, 12).Value = item.UnemploymentInsuranceDeduction;
                    worksheet.Cell(row, 13).Value = item.PersonalIncomeTaxDeduction;
                    worksheet.Cell(row, 14).Value = item.TotalDeductions;
                    worksheet.Cell(row, 15).Value = item.NetSalary;
                    worksheet.Cell(row, 16).Value = item.Status == "Paid" ? "Đã thanh toán" : "Chờ xử lý";
                    row++;
                }

                worksheet.Columns().AdjustToContents();
                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BangLuong_{month}_{year}.xlsx");
                }
            }
        }
    }

    public class UpdatePayrollDto
    {
        public decimal OvertimeHours { get; set; }
        public decimal AllowancesAmount { get; set; }
        public decimal BonusesAmount { get; set; }
    }
}