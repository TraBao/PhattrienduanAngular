using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using QuanLyNhanVien.Api.Models.Dtos;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MeetingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MeetingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveMeetings()
        {
            var meetings = await _context.Meetings
                .Where(m => m.IsActive)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
            return Ok(meetings);
        }
        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingDto request)
        {
            if (string.IsNullOrEmpty(request.Title))
                return BadRequest("Vui lòng nhập tiêu đề cuộc họp.");
            var creatorName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
            var uniqueRoomId = "HR_Meet_" + Guid.NewGuid().ToString().Substring(0, 8);

            var newMeeting = new Meeting
            {
                Title = request.Title,
                RoomId = uniqueRoomId,
                CreatedBy = creatorName,
                CreatedAt = DateTime.Now,
                IsActive = true
            };

            _context.Meetings.Add(newMeeting);
            await _context.SaveChangesAsync();

            return Ok(newMeeting);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> EndMeeting(int id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null) return NotFound("Không tìm thấy cuộc họp.");
            _context.Meetings.Remove(meeting);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã kết thúc cuộc họp." });
        }
    }
}