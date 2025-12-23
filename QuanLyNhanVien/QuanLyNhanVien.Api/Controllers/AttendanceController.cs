using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    public class CheckInRequest
    {
        public string? Note { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context) => _context = context;

        [HttpGet("today")]
        public async Task<IActionResult> GetTodayStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;
            var record = await _context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);
            return Ok(record);
        }

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest? request)
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var now = DateTime.Now;
            var today = DateTime.Today;
            if (await _context.Attendances.AnyAsync(a => a.UserId == userId && a.Date == today))
                return BadRequest(new { Message = "Bạn đã Check-in hôm nay rồi!" });
            string status = "OnTime";
            if (now.TimeOfDay > new TimeSpan(8, 15, 0)) status = "Late";

            var attendance = new Attendance
            {
                UserId = userId,
                Date = today,
                CheckInTime = now,
                Status = status,
                Note = request?.Note,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Check-in thành công!", Data = attendance });
        }

        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;
            var record = await _context.Attendances.FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            if (record == null) return BadRequest(new { Message = "Chưa Check-in!" });
            if (record.CheckOutTime != null) return BadRequest(new { Message = "Đã Check-out rồi!" });

            record.CheckOutTime = DateTime.Now;
            TimeSpan duration = record.CheckOutTime.Value - record.CheckInTime;
            double totalHours = duration.TotalHours;
            if (record.CheckInTime.TimeOfDay < new TimeSpan(12, 0, 0) &&
                record.CheckOutTime.Value.TimeOfDay > new TimeSpan(13, 30, 0))
            {
                totalHours -= 1.5;
            }

            record.TotalHours = Math.Max(0, Math.Round(totalHours, 2));
            if (record.CheckOutTime.Value.TimeOfDay < new TimeSpan(17, 0, 0))
            {
                record.Status = record.Status == "Late" ? "Late & EarlyLeave" : "EarlyLeave";
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Check-out thành công!", Data = record });
        }

        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var history = await _context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date)
                .Take(31)
                .ToListAsync();
            return Ok(history);
        }
    }
}