using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DashboardController(AppDbContext context) => _context = context;

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.Today;
            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            int totalEmployees = await _context.Employees.CountAsync();
            int pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == "Pending");

            decimal totalSalary = await _context.Payrolls
                .Where(p => p.Month == currentMonth && p.Year == currentYear)
                .SumAsync(p => p.NetSalary);

            var todayAttendance = await _context.Attendances.Where(a => a.Date == today).ToListAsync();

            var departmentStats = await _context.Departments
                .Select(d => new { Name = d.Name, Count = d.Employees.Count() })
                .ToListAsync();
            return Ok(new
            {
                stats = new
                {
                    TotalEmployees = totalEmployees,
                    TotalSalary = totalSalary,
                    PendingLeaves = pendingLeaves,
                    AttendanceToday = new
                    {
                        Present = todayAttendance.Count,
                        Late = todayAttendance.Count(a => a.Status != null && a.Status.Contains("Late")),
                        Absent = totalEmployees - todayAttendance.Count
                    },
                    DepartmentStats = departmentStats
                }
            });
        }

        [HttpGet("salary-growth/{year}")]
        public async Task<IActionResult> GetSalaryGrowth(int year)
        {
            var monthlyData = await _context.Payrolls
                .Where(p => p.Year == year)
                .GroupBy(p => p.Month)
                .Select(g => new { Month = g.Key, Total = g.Sum(p => p.NetSalary) })
                .ToListAsync();

            var result = new decimal[12];
            foreach (var item in monthlyData)
            {
                if (item.Month >= 1 && item.Month <= 12) result[item.Month - 1] = item.Total;
            }
            return Ok(result);
        }
        [HttpGet("daily-check-ins")]
        public async Task<IActionResult> GetDailyCheckIns()
        {
            var today = DateTime.Today;

            var checkIns = await (from attendance in _context.Attendances
                                  join employee in _context.Employees
                                  on attendance.UserId.ToLower() equals employee.Email.ToLower()
                                  where attendance.Date == today
                                  orderby attendance.CheckInTime
                                  select new
                                  {
                                      Employee = new
                                      {
                                          FullName = (employee.FirstName ?? "") + " " + (employee.LastName ?? ""),
                                          AvatarUrl = employee.AvatarUrl
                                      },
                                      Time = attendance.CheckInTime,
                                      Status = attendance.Status
                                  }).ToListAsync();

            return Ok(checkIns);
        }
    }
}