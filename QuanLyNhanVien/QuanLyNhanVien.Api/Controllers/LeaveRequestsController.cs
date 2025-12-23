using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;

namespace QuanLyNhanVien.Api.Controllers
{
    public class CreateLeaveRequestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = "";
        public string LeaveType { get; set; } = "Annual";
    }

    public class UpdateStatusDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; } = "";
        public string? AdminComment { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public LeaveRequestsController(AppDbContext context) => _context = context;
        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email")
                ?? User.FindFirstValue("sub")
                ?? string.Empty;
        }
        [HttpGet("my-leaves")]
        public async Task<IActionResult> GetMyLeaves()
        {
            var email = GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);
            if (employee == null) return Ok(new List<object>());

            var requests = await _context.LeaveRequests
                .Where(r => r.EmployeeId == employee.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.StartDate,
                    r.EndDate,
                    r.Reason,
                    r.Status,
                    r.LeaveType,
                    r.TotalDays,
                    r.CreatedAt,
                    r.AdminComment
                })
                .ToListAsync();

            return Ok(requests);
        }
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestDto dto)
        {
            var email = GetCurrentUserEmail();
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);

            if (employee == null) return BadRequest(new { Message = "Bạn cần có hồ sơ nhân viên để xin nghỉ." });

            var request = new LeaveRequest
            {
                EmployeeId = employee.Id,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Reason = dto.Reason,
                LeaveType = dto.LeaveType,
                Status = "Pending", // Mặc định chờ duyệt
                CreatedAt = DateTime.Now,
                TotalDays = (dto.EndDate.Date - dto.StartDate.Date).TotalDays + 1
            };

            _context.LeaveRequests.Add(request);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Gửi đơn thành công!" });
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetAllRequests()
        {
            if (!IsAdmin() && !HasPermission("MANAGE_LEAVES")) return Forbid();

            var requests = await _context.LeaveRequests
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.StartDate,
                    r.EndDate,
                    r.Reason,
                    r.Status,
                    r.LeaveType,
                    r.TotalDays,
                    r.CreatedAt,
                    r.AdminComment,
                    FullName = r.Employee != null ? (r.Employee.FirstName + " " + r.Employee.LastName) : "Ẩn danh"
                })
                .ToListAsync();

            return Ok(requests);
        }
        [HttpPost("update-status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusDto dto)
        {
            if (!IsAdmin() && !HasPermission("MANAGE_LEAVES")) return Forbid();

            var record = await _context.LeaveRequests.FindAsync(dto.RequestId);
            if (record == null) return NotFound();

            record.Status = dto.Status;
            record.AdminComment = dto.AdminComment;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã cập nhật trạng thái đơn." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var record = await _context.LeaveRequests.Include(r => r.Employee).FirstOrDefaultAsync(r => r.Id == id);
            if (record == null) return NotFound();

            var currentUserEmail = GetCurrentUserEmail();
            var isManager = IsAdmin() || HasPermission("MANAGE_LEAVES");
            var isOwner = record.Employee?.Email?.ToLower() == currentUserEmail.ToLower();

            if (!isManager && !isOwner)
            {
                return Forbid("Bạn không có quyền xóa đơn này.");
            }

            _context.LeaveRequests.Remove(record);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa đơn." });
        }
        private bool IsAdmin() => User.IsInRole("Admin");
        private bool HasPermission(string p) => User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(p));
    }
}