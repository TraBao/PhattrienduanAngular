using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyNhanVien.Api.Data;
using QuanLyNhanVien.Api.Models;
using System.Security.Claims;
using QuanLyNhanVien.Api.Filters;
using Microsoft.AspNetCore.SignalR;
using QuanLyNhanVien.Api.Hubs;
using Microsoft.AspNetCore.Identity;

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
        private readonly IHubContext<NotificationHub> _notificationHubContext;
        private readonly UserManager<ApplicationUser> _userManager;
        public LeaveRequestsController(
            AppDbContext context,
            IHubContext<NotificationHub> notificationHubContext,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _notificationHubContext = notificationHubContext;
            _userManager = userManager;
        }

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
        [LogActivity("Gửi yêu cầu nghỉ phép mới")]
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
                Status = "Pending",
                CreatedAt = DateTime.Now,
                TotalDays = (dto.EndDate.Date - dto.StartDate.Date).TotalDays + 1
            };

            _context.LeaveRequests.Add(request);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Gửi đơn thành công!" });
        }
        [HttpPost("cancel/{id}")]
        [LogActivity("Hủy đơn nghỉ phép")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            var request = await _context.LeaveRequests.Include(r => r.Employee).FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return NotFound();

            var currentUserEmail = GetCurrentUserEmail();
            bool isAdmin = IsAdmin() || HasPermission("MANAGE_LEAVES");
            bool isOwner = request.Employee?.Email?.ToLower() == currentUserEmail.ToLower();

            if (!isOwner && !isAdmin)
            {
                return Forbid("Bạn không có quyền hủy đơn này.");
            }
            if (request.Status == "Cancelled")
            {
                return BadRequest(new { Message = "Đơn này đã bị hủy trước đó rồi." });
            }

            request.Status = "Cancelled";
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã hủy đơn nghỉ phép." });
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetAllRequests()
        {
            var currentUserEmail = GetCurrentUserEmail();
            var currentUser = await _context.Employees.FirstOrDefaultAsync(e => e.Email == currentUserEmail);

            var managedDepartmentId = await _context.Departments
                .Where(d => d.ManagerId == currentUser.Id)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            bool isManager = managedDepartmentId > 0;
            bool isAdmin = IsAdmin() || HasPermission("MANAGE_LEAVES");

            if (!isAdmin && !isManager) return Forbid();

            var query = _context.LeaveRequests.AsQueryable();

            if (isManager && !isAdmin)
            {
                query = query.Include(r => r.Employee)
                             .Where(r => r.Employee.DepartmentId == managedDepartmentId);
            }

            var requests = await query
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
                    DepartmentName = r.Employee.Department.Name,
                    FullName = r.Employee != null ? (r.Employee.FirstName + " " + r.Employee.LastName) : "Ẩn danh"
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost("update-status")]
        [LogActivity("Phê duyệt/Từ chối đơn nghỉ phép")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusDto dto)
        {
            var currentUserEmail = GetCurrentUserEmail();
            var currentUser = await _context.Employees.FirstOrDefaultAsync(e => e.Email == currentUserEmail);

            var managedDepartmentId = await _context.Departments
                .Where(d => d.ManagerId == currentUser.Id)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            bool isManager = managedDepartmentId > 0;
            bool isAdmin = IsAdmin() || HasPermission("MANAGE_LEAVES");

            if (!isAdmin && !isManager) return Forbid();

            var record = await _context.LeaveRequests
                                       .Include(r => r.Employee)
                                       .FirstOrDefaultAsync(r => r.Id == dto.RequestId);

            if (record == null) return NotFound();
            if (record.Employee == null) return BadRequest("Đơn nghỉ phép không liên kết với nhân viên nào.");

            if (isManager && !isAdmin)
            {
                if (record.Employee.DepartmentId != managedDepartmentId)
                {
                    return Forbid("Bạn chỉ có thể duyệt đơn của nhân viên thuộc phòng ban mình quản lý.");
                }
            }
            record.Status = dto.Status;
            record.AdminComment = dto.AdminComment;

            var user = await _userManager.FindByEmailAsync(record.Employee.Email);
            if (user != null)
            {
                string notiMessage = "";
                if (dto.Status == "Approved")
                {
                    notiMessage = "Đơn xin nghỉ phép của bạn đã được PHÊ DUYỆT.";
                }
                else if (dto.Status == "Rejected")
                {
                    notiMessage = "Đơn xin nghỉ phép của bạn đã bị TỪ CHỐI.";
                }

                if (!string.IsNullOrEmpty(notiMessage))
                {
                    var noti = new Notification
                    {
                        UserId = user.Id,
                        Type = "LeaveRequest",
                        Message = notiMessage,
                        Link = "/my-leaves",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(noti);

                    await _notificationHubContext.Clients.User(user.Email).SendAsync("ReceiveNotification", noti);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã cập nhật trạng thái đơn." });
        }

        [HttpDelete("{id}")]
        [LogActivity("Xóa hoàn toàn đơn nghỉ phép")]
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
            return Ok(new { Message = "Đã xóa đơn vĩnh viễn." });
        }

        private bool IsAdmin() => User.IsInRole("Admin");
        private bool HasPermission(string p) => User.HasClaim(c => c.Type == "permissions" && c.Value.Contains(p));
    }
}