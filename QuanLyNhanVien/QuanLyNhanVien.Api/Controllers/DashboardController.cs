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

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            int totalEmployees = await _context.Employees.CountAsync();
            int currentMonth = DateTime.Now.Month;
            int currentYear = DateTime.Now.Year;

            decimal totalSalary = await _context.Payrolls
                .Where(p => p.Month == currentMonth && p.Year == currentYear)
                .SumAsync(p => p.FinalSalary);
            int pendingLeaves = await _context.LeaveRequests
                .CountAsync(l => l.Status == "Pending");
            var departmentStats = await _context.Employees
                .GroupBy(e => e.DepartmentId)
                .Select(g => new
                {
                    DepartmentId = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();
            return Ok(new
            {
                TotalEmployees = totalEmployees,
                TotalSalary = totalSalary,
                PendingLeaves = pendingLeaves,
                DepartmentStats = departmentStats
            });
        }
    }
}