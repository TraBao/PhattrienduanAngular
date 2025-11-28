using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;

            var record = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            return Ok(record);
        }

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var today = DateTime.Today;

            var existingRecord = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            if (existingRecord != null)
            {
                return BadRequest(new { Message = "Bạn đã Check-in hôm nay rồi!" });
            }

            var attendance = new Attendance
            {
                UserId = userId,
                Date = today,
                CheckInTime = DateTime.Now
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

            var record = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            if (record == null)
            {
                return BadRequest(new { Message = "Bạn chưa Check-in, không thể Check-out!" });
            }
            if (record.CheckOutTime != null)
            {
                return BadRequest(new { Message = "Bạn đã Check-out rồi." });
            }

            record.CheckOutTime = DateTime.Now;
            TimeSpan duration = record.CheckOutTime.Value - record.CheckInTime;
            record.TotalHours = Math.Round(duration.TotalHours, 2);

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
                .ToListAsync();

            return Ok(history);
        }
    }
}