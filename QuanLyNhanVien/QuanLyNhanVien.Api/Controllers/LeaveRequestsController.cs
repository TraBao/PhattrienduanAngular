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
    public class LeaveRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveRequestsController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("my-leaves")]
        public async Task<IActionResult> GetMyLeaves()
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var requests = await _context.LeaveRequests
                                         .Where(r => r.UserId == userId)
                                         .OrderByDescending(r => r.CreatedAt)
                                         .ToListAsync();
            return Ok(requests);
        }
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestDto dto)
        {
            if (dto.EndDate < dto.StartDate)
            {
                return BadRequest(new { Message = "Ngày kết thúc không được nhỏ hơn ngày bắt đầu!" });
            }
            var userId = User.FindFirstValue(ClaimTypes.Name);

            var request = new LeaveRequest
            {
                UserId = userId,
                FullName = userId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Reason = dto.Reason,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.LeaveRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Gửi đơn xin nghỉ thành công!" });
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await _context.LeaveRequests
                                         .OrderByDescending(r => r.CreatedAt)
                                         .ToListAsync();
            return Ok(requests);
        }
        [HttpPost("update-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateLeaveStatusDto dto)
        {
            var request = await _context.LeaveRequests.FindAsync(dto.RequestId);
            if (request == null)
            {
                return NotFound(new { Message = "Không tìm thấy đơn này" });
            }

            request.Status = dto.Status;
            request.AdminComment = dto.AdminComment;

            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã cập nhật trạng thái thành: {dto.Status}" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.Name);
            var request = await _context.LeaveRequests.FindAsync(id);

            if (request == null) return NotFound();

            if (request.UserId != userId && !User.IsInRole("Admin"))
            {
                return Unauthorized(new { Message = "Bạn không có quyền xóa đơn này" });
            }
            if (request.Status == "Approved" && !User.IsInRole("Admin"))
            {
                return BadRequest(new { Message = "Đơn đã duyệt không thể xóa." });
            }

            _context.LeaveRequests.Remove(request);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa đơn" });
        }
    }
}