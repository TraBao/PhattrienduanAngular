using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;
using ClosedXML.Excel;
using System.IO;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PayrollController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PayrollController(AppDbContext context)
        {
            _context = context;
        }
        [HttpPost("calculate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CalculatePayroll([FromQuery] int month, [FromQuery] int year)
        {
            var exists = await _context.Payrolls.AnyAsync(p => p.Month == month && p.Year == year);
            if (exists)
            {
                return BadRequest(new { Message = $"Bảng lương tháng {month}/{year} đã được tạo rồi!" });
            }

            var employees = await _context.Employees.ToListAsync();
            var payrolls = new List<Payroll>();
            decimal standardWorkDays = 26.0m;

            foreach (var emp in employees)
            {
                var workDays = await _context.Attendances
                    .Where(a => a.UserId == emp.Email && a.Date.Month == month && a.Date.Year == year)
                    .CountAsync();
                decimal finalSalary = (emp.Salary / standardWorkDays) * (decimal)workDays;

                var payroll = new Payroll
                {
                    EmployeeId = emp.Id,
                    EmployeeName = $"{emp.LastName} {emp.FirstName}",
                    Month = month,
                    Year = year,
                    BasicSalary = emp.Salary,
                    TotalWorkDays = workDays,
                    FinalSalary = Math.Round(finalSalary, 0),
                    Status = "Pending"
                };

                payrolls.Add(payroll);
            }

            _context.Payrolls.AddRange(payrolls);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã tính lương xong cho {payrolls.Count} nhân viên!", Data = payrolls });
        }
        [HttpGet("monthly")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMonthlyPayroll([FromQuery] int month, [FromQuery] int year)
        {
            var list = await _context.Payrolls
                .Where(p => p.Month == month && p.Year == year)
                .ToListAsync();
            return Ok(list);
        }
        [HttpPost("mark-paid/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            var payroll = await _context.Payrolls.FindAsync(id);
            if (payroll == null) return NotFound();

            payroll.Status = "Paid";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xác nhận thanh toán." });
        }
        [HttpGet("my-payslips")]
        public async Task<IActionResult> GetMyPayslips()
        {
            var email = User.FindFirstValue(ClaimTypes.Name);
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);
            if (employee == null) return BadRequest("Tài khoản chưa liên kết hồ sơ nhân viên.");

            var payslips = await _context.Payrolls
                .Where(p => p.EmployeeId == employee.Id)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .ToListAsync();

            return Ok(payslips);
        }
        [HttpGet("export")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ExportPayroll([FromQuery] int month, [FromQuery] int year)
        {
            var payrolls = await _context.Payrolls
                .Where(p => p.Month == month && p.Year == year)
                .ToListAsync();

            if (payrolls.Count == 0)
            {
                return NotFound("Chưa có dữ liệu lương tháng này để xuất.");
            }
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Bang Luong");
                worksheet.Cell(1, 1).Value = "ID Nhân viên";
                worksheet.Cell(1, 2).Value = "Họ và Tên";
                worksheet.Cell(1, 3).Value = "Lương Cơ bản";
                worksheet.Cell(1, 4).Value = "Số ngày công";
                worksheet.Cell(1, 5).Value = "Thực Lĩnh";
                worksheet.Cell(1, 6).Value = "Trạng thái";
                var headerRange = worksheet.Range("A1:F1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
                int row = 2;
                foreach (var item in payrolls)
                {
                    worksheet.Cell(row, 1).Value = item.EmployeeId;
                    worksheet.Cell(row, 2).Value = item.EmployeeName;
                    worksheet.Cell(row, 3).Value = item.BasicSalary;
                    worksheet.Cell(row, 4).Value = item.TotalWorkDays;
                    worksheet.Cell(row, 5).Value = item.FinalSalary;
                    worksheet.Cell(row, 6).Value = item.Status == "Paid" ? "Đã trả" : "Chưa trả";
                    row++;
                }
                worksheet.Columns().AdjustToContents();
                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    string fileName = $"BangLuong_{month}_{year}.xlsx";
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }
    }
}